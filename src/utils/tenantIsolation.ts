/**
 * KashFlow Financial OS - Strict Tenant & Agent Namespace Isolation Utility
 * 
 * Ensures every agent operates within a dedicated secure namespace sandbox,
 * preventing cross-contamination, unauthorized data leakage, and query collisions
 * across multi-agent sessions.
 */

import { Transaction, Wallet } from '../types';

export class TenantIsolationManager {
  /**
   * Generates a namespaced storage key for an agent's isolated data payload
   */
  static getAgentNamespacedKey(agentId: string, dataType: 'transactions' | 'wallets' | 'commissions' | 'payouts'): string {
    const cleanId = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `uzx_tenant_${cleanId}_${dataType}`;
  }

  /**
   * Isolates transactions belonging strictly to a specific agent ID
   */
  static isolateTransactions(transactions: Transaction[], agentId: string): Transaction[] {
    if (!agentId || agentId === 'admin' || agentId === 'all') return transactions;
    return transactions.filter(
      (tx) => tx.subagentId === agentId || tx.processedBy === agentId || tx.adminName === agentId
    );
  }

  /**
   * Isolates wallets assigned strictly to a specific agent ID
   */
  static isolateWallets(wallets: Wallet[], agentId: string): Wallet[] {
    if (!agentId || agentId === 'admin' || agentId === 'all') return wallets;
    return wallets.filter(
      (w) => w.agentId === agentId || w.assignedAgentId === agentId
    );
  }

  /**
   * Verifies that a data payload does not leak across tenant boundaries
   */
  static auditTenantIntegrity(records: { subagentId?: string; agentId?: string }[], currentAgentId: string): boolean {
    if (!currentAgentId || currentAgentId === 'admin') return true;
    return records.every(
      (rec) => !rec.subagentId || rec.subagentId === currentAgentId || rec.agentId === currentAgentId
    );
  }
}
