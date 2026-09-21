import { Agent, Transaction, Wallet } from '../types';

export interface AgentQueueMetrics {
  agentId: string;
  agentName: string;
  assignedTransactionsCount: number;
  assignedVolumeUSDT: number;
  capacityUtilizationPercent: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  isTrafficActive: boolean;
  insuranceCollateral: number;
  dailyOrdersMax: number;
  dailyMoneyCap: number;
  balanceUtilization: number;
  speedMode: 'low' | 'medium' | 'fast';
  supportedProviders: string[];
  status: 'healthy' | 'overloaded' | 'underutilized' | 'paused';
}

export interface AgentQueueBinding {
  agentId: string;
  agentName: string;
  metadata: Agent;
  queue: string[]; // List of pending transaction IDs
  linkedWallets: string[];
  supportedProviders: string[];
  speedMultiplier: number; // fast: 1.5, medium: 1.0, low: 0.6
  linkedAt: string;
  lastEvaluatedAt: string;
  status: 'active' | 'paused' | 'quota_exhausted' | 'below_threshold' | 'suspended';
}

export interface RouteSelectionResult {
  agent: Agent | null;
  matchedWallet: Wallet | null;
  reason: string;
  score: number;
  candidateCount: number;
  routeChannel?: string;
}

export interface TrafficImbalanceReport {
  timestamp: string;
  totalActiveAgents: number;
  totalAssignedOrders: number;
  totalAssignedVolumeUSDT: number;
  averageOrdersPerAgent: number;
  averageVolumePerAgent: number;
  imbalanceScore: number; // 0 (perfect balance) to 100 (extreme skew)
  imbalanceLevel: 'balanced' | 'slight_skew' | 'high_imbalance';
  overloadedAgents: string[];
  underutilizedAgents: string[];
  agentMetrics: AgentQueueMetrics[];
  recommendations: string[];
}

export class RouteAssignmentService {
  private static instance: RouteAssignmentService;
  private agentQueues: Map<string, AgentQueueBinding> = new Map();

  private constructor() {}

  public static getInstance(): RouteAssignmentService {
    if (!RouteAssignmentService.instance) {
      RouteAssignmentService.instance = new RouteAssignmentService();
    }
    return RouteAssignmentService.instance;
  }

  /**
   * Programmatically links a newly onboarded agent into the automated routing queue matrix,
   * binding their operational limits, speed mode, payment providers, and insurance thresholds.
   */
  public linkOnboardedAgent(agent: Agent, wallets: Wallet[] = []): AgentQueueBinding {
    const agentWallets = wallets.filter(
      (w) => (w.assignedAgentId === agent.id || w.agentId === agent.id) && w.status === 'active'
    );

    const providersSet = new Set<string>();
    if (agent.depositPaymentMethod) providersSet.add(agent.depositPaymentMethod);
    if (agent.depositMethod) providersSet.add(agent.depositMethod);
    agentWallets.forEach((w) => {
      if (w.provider) providersSet.add(w.provider);
    });

    // Default Egyptian cash providers if none explicitly set
    if (providersSet.size === 0) {
      providersSet.add('Vodafone Cash');
      providersSet.add('InstaPay');
    }

    const speedMultiplier =
      agent.speedMode === 'fast' ? 1.5 : agent.speedMode === 'low' ? 0.6 : 1.0;

    const existing = this.agentQueues.get(agent.id);
    const initialQueue = existing ? existing.queue : [];

    let queueStatus: AgentQueueBinding['status'] = 'active';
    if (agent.status === 'suspended') {
      queueStatus = 'suspended';
    } else if (!agent.trafficActive) {
      queueStatus = 'paused';
    } else if (agent.currentBalance < agent.trafficThreshold) {
      queueStatus = 'below_threshold';
    } else if (
      agent.todayAssignedOrders >= agent.dailyOrdersMax ||
      agent.todayAssignedVolumeUSDT >= (agent.dailyVolumeMaxUSDT || agent.dailyOrderLimit?.dailyMoneyCap || 500000)
    ) {
      queueStatus = 'quota_exhausted';
    }

    const binding: AgentQueueBinding = {
      agentId: agent.id,
      agentName: agent.name,
      metadata: { ...agent },
      queue: initialQueue,
      linkedWallets: agentWallets.map((w) => w.id),
      supportedProviders: Array.from(providersSet),
      speedMultiplier,
      linkedAt: existing ? existing.linkedAt : new Date().toISOString(),
      lastEvaluatedAt: new Date().toISOString(),
      status: queueStatus,
    };

    this.agentQueues.set(agent.id, binding);
    console.log(
      `[RouteAssignmentService] Programmatically linked agent [${agent.name}] (${agent.id}) to queue:agent:${agent.id} (Speed: ${agent.speedMode}, Providers: ${binding.supportedProviders.join(', ')})`
    );

    return binding;
  }

  /**
   * Updates an existing agent's assignment metadata in their dedicated transaction queue
   */
  public updateAgentMetadata(agent: Agent, wallets: Wallet[] = []): void {
    this.linkOnboardedAgent(agent, wallets);
  }

  /**
   * Registers a bare queue for an agent if not present
   */
  public registerAgentQueue(agentId: string): void {
    if (!this.agentQueues.has(agentId)) {
      this.agentQueues.set(agentId, {
        agentId,
        agentName: agentId,
        metadata: {
          id: agentId,
          name: agentId,
          username: agentId,
          email: '',
          phone: '',
          status: 'active',
          insuranceDeposit: 10000,
          currentBalance: 10000,
          trafficThreshold: 5000,
          trafficActive: true,
          speedMode: 'medium',
          dailyOrdersMin: 5,
          dailyOrdersMax: 50,
          dailyVolumeMinUSDT: 1000,
          dailyVolumeMaxUSDT: 100000,
          todayProcessedCount: 0,
          todayAssignedOrders: 0,
          todayAssignedVolumeUSDT: 0,
          depositPaymentMethod: 'Vodafone Cash',
          depositPaymentAddress: '',
          assignedWalletCount: 0,
          assignedWalletIds: [],
          lastActiveAt: new Date().toISOString(),
        },
        queue: [],
        linkedWallets: [],
        supportedProviders: ['Vodafone Cash', 'InstaPay'],
        speedMultiplier: 1.0,
        linkedAt: new Date().toISOString(),
        lastEvaluatedAt: new Date().toISOString(),
        status: 'active',
      });
    }
  }

  /**
   * Links a transaction to an agent's dedicated queue
   */
  public enqueueTransaction(agentId: string, transactionId: string): void {
    this.registerAgentQueue(agentId);
    const binding = this.agentQueues.get(agentId);
    if (binding && !binding.queue.includes(transactionId)) {
      binding.queue.unshift(transactionId);
      binding.lastEvaluatedAt = new Date().toISOString();
      this.agentQueues.set(agentId, binding);
    }
  }

  /**
   * Removes a settled or cancelled transaction from an agent's queue
   */
  public dequeueTransaction(agentId: string, transactionId: string): void {
    const binding = this.agentQueues.get(agentId);
    if (binding) {
      binding.queue = binding.queue.filter((id) => id !== transactionId);
      binding.lastEvaluatedAt = new Date().toISOString();
      this.agentQueues.set(agentId, binding);
    }
  }

  /**
   * Retrieves an agent's pending transaction ID queue
   */
  public getAgentQueue(agentId: string): string[] {
    return this.agentQueues.get(agentId)?.queue || [];
  }

  /**
   * Retrieves an agent's complete queue binding details
   */
  public getAgentBinding(agentId: string): AgentQueueBinding | null {
    return this.agentQueues.get(agentId) || null;
  }

  /**
   * Unlinks an agent from the queue network
   */
  public unlinkAgent(agentId: string): void {
    this.agentQueues.delete(agentId);
  }

  /**
   * Evaluates whether an agent is ready to intake automated bot traffic
   */
  public evaluateAgentEligibility(agent: Agent, amount: number): { isEligible: boolean; reason: string } {
    if (agent.status !== 'active') {
      return { isEligible: false, reason: 'Agent account is not active' };
    }
    if (agent.trafficActive === false) {
      return { isEligible: false, reason: 'Agent traffic is toggled off' };
    }
    if (agent.currentBalance < agent.trafficThreshold) {
      return {
        isEligible: false,
        reason: `Balance (${agent.currentBalance} USDT) is below traffic threshold (${agent.trafficThreshold} USDT)`,
      };
    }
    if (agent.todayAssignedOrders >= agent.dailyOrdersMax) {
      return {
        isEligible: false,
        reason: `Daily order quota reached (${agent.todayAssignedOrders}/${agent.dailyOrdersMax})`,
      };
    }
    const maxVolume = agent.dailyVolumeMaxUSDT || agent.dailyOrderLimit?.dailyMoneyCap || 500000;
    if (agent.todayAssignedVolumeUSDT + amount > maxVolume) {
      return {
        isEligible: false,
        reason: `Daily volume cap exceeded (${agent.todayAssignedVolumeUSDT + amount} > ${maxVolume} USDT)`,
      };
    }

    return { isEligible: true, reason: 'Eligible for assignment' };
  }

  /**
   * Selects the optimal agent using metadata-driven priority routing:
   * 1. Evaluates agent assignment metadata (speedMode, dailyOrdersMax, dailyVolumeMaxUSDT, providers, ratios)
   * 2. Evaluates wallet and provider compatibility
   * 3. Uses least-loaded queue scoring with speed mode multipliers
   */
  public selectBestAgentForTransaction(
    txType: 'deposit' | 'withdrawal',
    amount: number,
    provider: string,
    eligibleAgents: Agent[],
    wallets: Wallet[],
    currency: string = 'USDT'
  ): RouteSelectionResult {
    if (!eligibleAgents || eligibleAgents.length === 0) {
      return { agent: null, matchedWallet: null, reason: 'No eligible agents online', score: 999, candidateCount: 0 };
    }

    // Filter agents passing eligibility criteria
    const verifiedCandidates = eligibleAgents.filter((a) => {
      const evaluation = this.evaluateAgentEligibility(a, amount);
      const currencyMatch = !a.currency || a.currency === currency || a.currency === 'USDT';
      return evaluation.isEligible && currencyMatch;
    });

    const candidates = verifiedCandidates.length > 0 ? verifiedCandidates : eligibleAgents;

    // Score and rank candidates based on metadata, speed multipliers, provider match, and queue backlog
    const scoredAgents = candidates.map((agent) => {
      const binding = this.agentQueues.get(agent.id) || this.linkOnboardedAgent(agent, wallets);
      
      const agentWallets = wallets.filter(
        (w) => (w.assignedAgentId === agent.id || w.agentId === agent.id) && w.status === 'active'
      );
      const hasProviderWallet = agentWallets.some((w) => w.provider === provider);
      const supportsProviderMethod =
        binding.supportedProviders.includes(provider) ||
        agent.depositPaymentMethod === provider ||
        agent.depositMethod === provider;

      const maxOrders = agent.dailyOrdersMax || 50;
      const maxVolume = agent.dailyVolumeMaxUSDT || agent.dailyOrderLimit?.dailyMoneyCap || 100000;
      
      const orderRatio = (agent.todayAssignedOrders || 0) / Math.max(1, maxOrders);
      const volumeRatio = (agent.todayAssignedVolumeUSDT || 0) / Math.max(1, maxVolume);
      const queueDepth = binding.queue.length;

      // Base Workload Score (Lower = higher priority)
      let workloadScore = orderRatio * 0.4 + volumeRatio * 0.4 + queueDepth * 0.1;

      // Speed Mode Multiplier: Fast mode agents take priority (score reduced by up to 0.25)
      const speedBonus = agent.speedMode === 'fast' ? 0.25 : agent.speedMode === 'low' ? -0.15 : 0;
      workloadScore -= speedBonus;

      // Provider Compatibility Bonus
      if (hasProviderWallet) {
        workloadScore -= 0.35; // Direct active wallet match
      } else if (supportsProviderMethod) {
        workloadScore -= 0.15; // Supported method match
      }

      // Custom Deposit/Withdrawal Ratio Alignment Metadata
      if (agent.customDepositPercent !== undefined) {
        const targetDepositRatio = agent.customDepositPercent / 100;
        const totalTx = (agent.todayAssignedOrders || 0) + 1;
        const estimatedDeposits = Math.round(totalTx * 0.7);
        const currentDepositRatio = estimatedDeposits / Math.max(1, totalTx);

        if (txType === 'deposit' && currentDepositRatio < targetDepositRatio) {
          workloadScore -= 0.1; // Prioritize deposit to satisfy agent's desired deposit ratio
        } else if (txType === 'withdrawal' && currentDepositRatio > targetDepositRatio) {
          workloadScore -= 0.1; // Prioritize withdrawal to satisfy agent's desired ratio
        }
      }

      // Collateral Buffer Advantage (Agents with higher insurance ratio are prioritized for stability)
      if (agent.insuranceDeposit && agent.insuranceDeposit >= 50000) {
        workloadScore -= 0.05;
      }

      return {
        agent,
        score: workloadScore,
        wallets: agentWallets,
        binding,
        hasProviderWallet,
      };
    });

    // Sort ascending (lowest workload score first)
    scoredAgents.sort((a, b) => a.score - b.score);

    const bestCandidate = scoredAgents[0];
    if (!bestCandidate) {
      return { agent: null, matchedWallet: null, reason: 'Could not select agent from candidates', score: 999, candidateCount: candidates.length };
    }

    // Find best wallet for this transaction
    const matchedWallet =
      bestCandidate.wallets.find((w) => w.provider === provider) ||
      bestCandidate.wallets[0] ||
      null;

    const speedLabel = bestCandidate.agent.speedMode?.toUpperCase() || 'MEDIUM';
    const reason = `Assigned via Balanced Route Assignment Engine (Score: ${bestCandidate.score.toFixed(2)}, Speed: ${speedLabel}, Queue: queue:agent:${bestCandidate.agent.id})`;

    return {
      agent: bestCandidate.agent,
      matchedWallet,
      reason,
      score: bestCandidate.score,
      candidateCount: candidates.length,
      routeChannel: `queue:agent:${bestCandidate.agent.id}`,
    };
  }

  /**
   * Analyzes the distribution across all agent queues and generates a diagnostic report
   */
  public generateTrafficImbalanceReport(
    agents: Agent[],
    pendingDeposits: Transaction[],
    pendingWithdrawals: Transaction[],
    completedDeposits: Transaction[],
    completedWithdrawals: Transaction[]
  ): TrafficImbalanceReport {
    const agentMetrics: AgentQueueMetrics[] = agents.map((agent) => {
      const agentPendingDeps = pendingDeposits.filter((t) => t.subagentId === agent.id);
      const agentPendingWdls = pendingWithdrawals.filter((t) => t.subagentId === agent.id);

      const assignedCount =
        (agent.todayAssignedOrders || 0) + agentPendingDeps.length + agentPendingWdls.length;
      const assignedVolume =
        (agent.todayAssignedVolumeUSDT || 0) +
        agentPendingDeps.reduce((sum, t) => sum + t.amount, 0) +
        agentPendingWdls.reduce((sum, t) => sum + t.amount, 0);

      const maxOrders = agent.dailyOrdersMax || 50;
      const capacityPercent = Math.min(100, Math.round((assignedCount / maxOrders) * 100));

      let status: 'healthy' | 'overloaded' | 'underutilized' | 'paused' = 'healthy';
      if (!agent.trafficActive || agent.status !== 'active') {
        status = 'paused';
      } else if (capacityPercent >= 85) {
        status = 'overloaded';
      } else if (capacityPercent < 15 && agents.length > 1) {
        status = 'underutilized';
      }

      const binding = this.agentQueues.get(agent.id);
      const supportedProviders = binding?.supportedProviders || [agent.depositPaymentMethod || 'Vodafone Cash'];

      return {
        agentId: agent.id,
        agentName: agent.name,
        assignedTransactionsCount: assignedCount,
        assignedVolumeUSDT: assignedVolume,
        capacityUtilizationPercent: capacityPercent,
        pendingDepositsCount: agentPendingDeps.length,
        pendingWithdrawalsCount: agentPendingWdls.length,
        isTrafficActive: agent.trafficActive !== false,
        insuranceCollateral: agent.insuranceDeposit || 0,
        dailyOrdersMax: maxOrders,
        dailyMoneyCap: agent.dailyVolumeMaxUSDT || agent.dailyOrderLimit?.dailyMoneyCap || 100000,
        balanceUtilization: agent.insuranceDeposit ? (assignedVolume / agent.insuranceDeposit) * 100 : 0,
        speedMode: agent.speedMode || 'medium',
        supportedProviders,
        status,
      };
    });

    const activeCount = agents.filter((a) => a.trafficActive !== false && a.status === 'active').length;
    const totalOrders = agentMetrics.reduce((sum, m) => sum + m.assignedTransactionsCount, 0);
    const totalVolume = agentMetrics.reduce((sum, m) => sum + m.assignedVolumeUSDT, 0);

    const avgOrders = activeCount > 0 ? totalOrders / activeCount : 0;
    const avgVolume = activeCount > 0 ? totalVolume / activeCount : 0;

    // Calculate Variance and Imbalance Score
    let varianceSum = 0;
    agentMetrics.forEach((m) => {
      if (m.isTrafficActive) {
        varianceSum += Math.pow(m.assignedTransactionsCount - avgOrders, 2);
      }
    });

    const stdDev = activeCount > 0 ? Math.sqrt(varianceSum / activeCount) : 0;
    const imbalanceScore = avgOrders > 0 ? Math.min(100, Math.round((stdDev / avgOrders) * 60)) : 0;

    let imbalanceLevel: 'balanced' | 'slight_skew' | 'high_imbalance' = 'balanced';
    if (imbalanceScore > 50) {
      imbalanceLevel = 'high_imbalance';
    } else if (imbalanceScore > 25) {
      imbalanceLevel = 'slight_skew';
    }

    const overloadedAgents = agentMetrics
      .filter((m) => m.status === 'overloaded')
      .map((m) => `${m.agentName} (${m.agentId})`);

    const underutilizedAgents = agentMetrics
      .filter((m) => m.status === 'underutilized' && m.isTrafficActive)
      .map((m) => `${m.agentName} (${m.agentId})`);

    const recommendations: string[] = [];
    if (imbalanceLevel === 'high_imbalance') {
      recommendations.push(
        `High traffic variance detected (Score: ${imbalanceScore}/100). Consider tuning daily limits or speed mode on underutilized agents.`
      );
    }
    if (overloadedAgents.length > 0) {
      recommendations.push(
        `Agents ${overloadedAgents.join(', ')} are nearing 90% capacity. RouteAssignmentService is prioritizing lighter queues.`
      );
    }
    if (underutilizedAgents.length > 0) {
      recommendations.push(
        `Agents ${underutilizedAgents.join(', ')} have low assignment volume. Ensure their provider wallets match active client methods.`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push('Automated traffic routing is balanced optimally across all active agent queues.');
    }

    return {
      timestamp: new Date().toISOString(),
      totalActiveAgents: activeCount,
      totalAssignedOrders: totalOrders,
      totalAssignedVolumeUSDT: totalVolume,
      averageOrdersPerAgent: Math.round(avgOrders * 10) / 10,
      averageVolumePerAgent: Math.round(avgVolume),
      imbalanceScore,
      imbalanceLevel,
      overloadedAgents,
      underutilizedAgents,
      agentMetrics,
      recommendations,
    };
  }
}

export const routeAssignmentService = RouteAssignmentService.getInstance();
