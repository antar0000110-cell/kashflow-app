import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  generateAuthToken,
  verifyAuthToken,
  verifyUserPassword,
  requireAuth,
  requireAdmin,
  handleRefreshToken,
  AuthenticatedRequest
} from './auth';
import { realtime } from './ws';

export const apiRouter = Router();

// ----------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/auth/login', async (req, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
      return;
    }

    const cleanUsername = String(username).trim();
    const user = db.findUserByUsername(cleanUsername);

    if (!user) {
      // Return identical failure message to prevent username enumeration
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact the administrator.'
      });
      return;
    }

    const isValidPassword = await verifyUserPassword(password, user.passwordHash);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
      return;
    }

    // Generate secure JWT token
    const token = generateAuthToken(user);

    // Fetch agent profile details if user is an agent
    let agentDetails = null;
    if (user.role === 'agent' && user.agentId) {
      agentDetails = db.getAgentById(user.agentId);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        agentId: user.agentId,
        agentName: agentDetails?.name || user.name,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('[API Login Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Internal authentication error.'
    });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

apiRouter.post('/auth/refresh', handleRefreshToken);

// Real Session Check endpoint validating JWT token
apiRouter.post('/session-check', (req, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      authenticated: false,
      rejected: true,
      error: 'Session token required.'
    });
    return;
  }

  const token = authHeader.split(' ')[1].trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({
      authenticated: false,
      rejected: true,
      error: 'Session expired or token invalid.'
    });
    return;
  }

  res.json({
    authenticated: true,
    role: payload.role,
    user: payload,
    timestamp: new Date().toISOString()
  });
});

apiRouter.post('/verify-session', (req, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ valid: false });
    return;
  }
  const token = authHeader.split(' ')[1].trim();
  const payload = verifyAuthToken(token);
  res.json({ valid: Boolean(payload) });
});

// ----------------------------------------------------
// 2. DATA SYNCHRONIZATION ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getFullSnapshot(user.role, user.agentId);
  res.json({
    success: true,
    data: snapshot
  });
});

// ----------------------------------------------------
// 3. TRANSACTIONS MANAGEMENT
// ----------------------------------------------------

apiRouter.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const filter = user.role === 'agent' ? { agentId: user.agentId } : undefined;
  const list = db.getTransactions(filter);
  res.json({ success: true, transactions: list });
});

apiRouter.post('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const txData = req.body;

  const newTx = {
    ...txData,
    id: txData.id || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    expiresAt: txData.expiresAt || new Date(Date.now() + 4 * 3600000).toISOString(),
    status: txData.status || 'Pending'
  };

  const created = db.createTransaction(newTx);

  // Broadcast to all admins and the specific agent in real-time
  realtime.broadcast('transaction:created', created, 'admin');
  if (created.subagentId) {
    realtime.broadcast('transaction:created', created, `agent:${created.subagentId}`);
  }

  res.json({ success: true, transaction: created });
});

apiRouter.patch('/transactions/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const {
    status,
    processedBy,
    rejectionReason,
    amount: customAmount,
    processingDurationSeconds,
    processingDurationFormatted,
    processedAt
  } = req.body;
  const user = req.user!;

  const existingTx = db.getTransactionById(id);
  if (!existingTx) {
    res.status(404).json({ success: false, message: 'Transaction not found.' });
    return;
  }

  // If agent, verify they own the transaction or it is an unassigned system broadcast
  if (user.role === 'agent' && existingTx.subagentId && existingTx.subagentId !== user.agentId) {
    res.status(403).json({ success: false, message: 'Unauthorized to modify this transaction.' });
    return;
  }

  // Strictly prevent agents from tampering with already finalized/completed transactions
  if (user.role === 'agent' && (existingTx.status === 'Approved' || existingTx.status === 'Rejected' || existingTx.status === 'Cancelled')) {
    res.status(400).json({ success: false, message: 'Finalized transactions cannot be modified by agents. Only administrators may modify settled records.' });
    return;
  }

  // Calculate immutable processing duration
  const createdAtMs = new Date(existingTx.createdAt || existingTx.dateOfCreation || Date.now()).getTime();
  const nowMs = Date.now();
  const elapsedSec = processingDurationSeconds !== undefined
    ? Number(processingDurationSeconds)
    : Math.max(0, Math.floor((nowMs - (isNaN(createdAtMs) ? nowMs : createdAtMs)) / 1000));

  const pad = (n: number) => String(n).padStart(2, '0');
  const calcFormattedDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  const finalDurationFormatted = processingDurationFormatted || calcFormattedDuration(elapsedSec);
  const finalAmount = customAmount !== undefined && Number(customAmount) > 0 ? Number(customAmount) : existingTx.amount;

  const updates: any = {
    status,
    amount: finalAmount,
    processedBy: processedBy || user.name || user.username,
    processedByRole: user.role,
    processedAt: processedAt || new Date().toISOString(),
    processingDurationSeconds: elapsedSec,
    processingDurationFormatted: finalDurationFormatted,
    duration: finalDurationFormatted,
    processingTimeMinutes: Math.max(1, Math.round(elapsedSec / 60)),
    timeOfProcessing: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };

  if (user.role === 'agent') {
    updates.subagentId = user.agentId;
    updates.subagentName = user.name;
  }

  if (rejectionReason) {
    updates.rejectionReason = rejectionReason;
  }

  // If Approved, update agent balance, profit balance, and wallet totals
  if (status === 'Approved' && existingTx.status !== 'Approved') {
    let finalSubagentId = existingTx.subagentId || (user.role === 'agent' ? user.agentId : undefined);
    if (!finalSubagentId) {
      const walletId = existingTx.targetWalletId || existingTx.sourceWalletId;
      if (walletId) {
        const wallet = db.getWallets().find((w) => w.walletNumber === walletId || w.id === walletId);
        if (wallet && (wallet.assignedAgentId || wallet.agentId)) {
          finalSubagentId = wallet.assignedAgentId || wallet.agentId || undefined;
        }
      }
    }

    if (finalSubagentId && !updates.subagentId) {
      updates.subagentId = finalSubagentId;
      const targetAgent = db.getAgentById(finalSubagentId);
      if (targetAgent) {
        updates.subagentName = targetAgent.name;
      }
    }

    if (finalSubagentId) {
      const agent = db.getAgentById(finalSubagentId);
      if (agent) {
        const delta = existingTx.type === 'deposit' ? finalAmount : -finalAmount;
        const newBalance = Math.max(0, agent.currentBalance + delta);

        // Calculate profit based on agent's individual deposit / withdrawal commission rates
        const isDeposit = existingTx.type === 'deposit';
        const commissionPercent = isDeposit
          ? (agent.depositCommissionPercent !== undefined ? Number(agent.depositCommissionPercent) : 3.0)
          : (agent.withdrawalCommissionPercent !== undefined ? Number(agent.withdrawalCommissionPercent) : 1.0);

        const profitEarned = Number(((finalAmount * commissionPercent) / 100).toFixed(2));
        const newProfitBalance = Number(((agent.profitBalance || 0) + profitEarned).toFixed(2));
        const newTotalEarned = Number(((agent.totalEarnedCommission || 0) + profitEarned).toFixed(2));

        updates.commissionEarned = profitEarned;
        updates.commissionRateApplied = commissionPercent;

        db.updateAgent(agent.id, {
          currentBalance: newBalance,
          profitBalance: newProfitBalance,
          totalEarnedCommission: newTotalEarned,
          todayProcessedCount: (agent.todayProcessedCount || 0) + 1,
          processedOrdersCount: (agent.processedOrdersCount || 0) + 1,
          todayAssignedVolumeUSDT: (agent.todayAssignedVolumeUSDT || 0) + finalAmount,
          processedVolume: (agent.processedVolume || 0) + finalAmount,
          lastActiveAt: new Date().toISOString()
        });

        realtime.broadcast('agent:updated', { 
          id: agent.id, 
          currentBalance: newBalance,
          profitBalance: newProfitBalance,
          totalEarnedCommission: newTotalEarned,
          todayProcessedCount: (agent.todayProcessedCount || 0) + 1,
          processedOrdersCount: (agent.processedOrdersCount || 0) + 1,
        });
      }
    }

    if (existingTx.targetWalletId) {
      const wallet = db.getWallets().find((w) => w.walletNumber === existingTx.targetWalletId || w.id === existingTx.targetWalletId);
      if (wallet) {
        const newBal = wallet.balance + (existingTx.type === 'deposit' ? finalAmount : -finalAmount);
        db.updateWallet(wallet.id, {
          balance: newBal,
          todayReceived: wallet.todayReceived + (existingTx.type === 'deposit' ? finalAmount : 0)
        });
        realtime.broadcast('wallet:updated', { id: wallet.id, balance: newBal });
      }
    }
  }

  const updated = db.updateTransaction(id, updates);

  // Real-time broadcast
  realtime.broadcast('transaction:updated', updated, 'admin');
  if (updated?.subagentId) {
    realtime.broadcast('transaction:updated', updated, `agent:${updated.subagentId}`);
  }

  res.json({ success: true, transaction: updated });
});

// ----------------------------------------------------
// 4. AGENTS & WALLETS (Admin Only)
// ----------------------------------------------------

apiRouter.get('/agents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role === 'agent') {
    const agent = db.getAgentById(user.agentId || '');
    res.json({ success: true, agents: agent ? [agent] : [] });
    return;
  }
  res.json({ success: true, agents: db.getAgents() });
});

apiRouter.post('/agents', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const agentData = req.body;
  const newAgent = db.createAgent(agentData);

  // Register login account for the agent so they can authenticate immediately
  if (newAgent.username) {
    const existing = db.findUserByUsername(newAgent.username);
    if (!existing) {
      db.createUser({
        username: newAgent.username,
        passwordHash: bcrypt.hashSync(agentData.password || 'Agent@123', 10),
        role: 'agent',
        agentId: newAgent.id,
        name: newAgent.name,
        phone: newAgent.phone,
        email: newAgent.email,
        status: newAgent.status || 'active'
      });
    }
  }

  realtime.broadcast('agent:created', newAgent);
  realtime.broadcast('agent:updated', newAgent);
  res.json({ success: true, agent: newAgent });
});

apiRouter.patch('/agents/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.updateAgent(id, updates);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Agent not found' });
    return;
  }
  realtime.broadcast('agent:updated', updated);
  res.json({ success: true, agent: updated });
});

apiRouter.get('/wallets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allWallets = db.getWallets();
  if (user.role === 'agent') {
    res.json({ success: true, wallets: allWallets.filter((w) => w.agentId === user.agentId || w.assignedAgentId === user.agentId) });
    return;
  }
  res.json({ success: true, wallets: allWallets });
});

apiRouter.post('/wallets', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const walletData = req.body;
  const newWallet = db.createWallet(walletData);
  realtime.broadcast('wallet:created', newWallet);
  realtime.broadcast('wallet:updated', newWallet);
  res.json({ success: true, wallet: newWallet });
});

apiRouter.patch('/wallets/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.updateWallet(id, updates);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Wallet not found' });
    return;
  }
  realtime.broadcast('wallet:updated', updated);
  res.json({ success: true, wallet: updated });
});

// ----------------------------------------------------
// 5. NOTIFICATIONS
// ----------------------------------------------------

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({ success: true, notifications: db.getNotifications(user.role, user.agentId) });
});

apiRouter.post('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.addNotification(req.body);
  if (notif.agentId || notif.targetAgentId) {
    const target = notif.agentId || notif.targetAgentId;
    realtime.broadcast('notification:created', notif, `agent:${target}`);
    realtime.broadcast('notification:created', notif, 'admin');
  } else {
    realtime.broadcast('notification:created', notif);
  }
  res.json({ success: true, notification: notif });
});

apiRouter.post('/admin/reset-system-data', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.status(403).json({
    success: false,
    message: 'Reset and database cleanup features are strictly disabled in the production environment for security reasons.'
  });
});
