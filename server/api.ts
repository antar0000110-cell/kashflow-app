import { Router, Response } from 'express';
import { db } from './db';
import {
  generateAuthToken,
  verifyAuthToken,
  verifyUserPassword,
  requireAuth,
  requireAdmin,
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
  const { status, processedBy, rejectionReason } = req.body;
  const user = req.user!;

  const existingTx = db.getTransactionById(id);
  if (!existingTx) {
    res.status(404).json({ success: false, message: 'Transaction not found.' });
    return;
  }

  // If agent, verify they own the transaction
  if (user.role === 'agent' && existingTx.subagentId !== user.agentId) {
    res.status(403).json({ success: false, message: 'Unauthorized to modify this transaction.' });
    return;
  }

  const updates: any = {
    status,
    processedBy: processedBy || user.name || user.username,
    processedByRole: user.role,
    timeOfProcessing: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };

  if (rejectionReason) {
    updates.rejectionReason = rejectionReason;
  }

  // If Approved, update agent balance and wallet totals
  if (status === 'Approved' && existingTx.status !== 'Approved') {
    if (existingTx.subagentId) {
      const agent = db.getAgentById(existingTx.subagentId);
      if (agent) {
        const delta = existingTx.type === 'deposit' ? existingTx.amount : -existingTx.amount;
        const newBalance = Math.max(0, agent.currentBalance + delta);
        db.updateAgent(agent.id, {
          currentBalance: newBalance,
          todayProcessedCount: (agent.todayProcessedCount || 0) + 1,
          lastActiveAt: new Date().toISOString()
        });
        realtime.broadcast('agent:updated', { id: agent.id, currentBalance: newBalance });
      }
    }

    if (existingTx.targetWalletId) {
      const wallet = db.getWallets().find((w) => w.walletNumber === existingTx.targetWalletId || w.id === existingTx.targetWalletId);
      if (wallet) {
        const newBal = wallet.balance + (existingTx.type === 'deposit' ? existingTx.amount : -existingTx.amount);
        db.updateWallet(wallet.id, {
          balance: newBal,
          todayReceived: wallet.todayReceived + (existingTx.type === 'deposit' ? existingTx.amount : 0)
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
    res.json({ success: true, wallets: allWallets.filter((w) => w.agentId === user.agentId) });
    return;
  }
  res.json({ success: true, wallets: allWallets });
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
  res.json({ success: true, notifications: db.getNotifications() });
});

apiRouter.post('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.addNotification(req.body);
  realtime.broadcast('notification:created', notif);
  res.json({ success: true, notification: notif });
});
