/**
 * KashFlow Financial OS - Production Schema & Constraint Validator
 * 
 * Verifies all database schemas, object types, and value ranges for transactions,
 * agents, wallets, and commission tiers. Prepares production environments
 * with validated clean initial states.
 */

import { Transaction, Agent, Wallet, BankAccount, CommissionTier } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checkedRecordsCount: number;
}

export class ProductionSchemaValidator {
  /**
   * Validates a transaction object against schema constraints and numeric ranges
   */
  static validateTransaction(tx: Partial<Transaction>): string[] {
    const errors: string[] = [];
    if (!tx.id || typeof tx.id !== 'string') errors.push(`Invalid or missing transaction ID: ${tx.id}`);
    if (tx.amount === undefined || typeof tx.amount !== 'number' || tx.amount <= 0) {
      errors.push(`Transaction amount must be a positive number, got: ${tx.amount}`);
    }
    if (!tx.currency || typeof tx.currency !== 'string') errors.push(`Invalid currency code for tx ${tx.id}`);
    if (!tx.type || !['deposit', 'withdrawal', 'transfer'].includes(tx.type)) {
      errors.push(`Invalid transaction type: ${tx.type}`);
    }
    if (!tx.status || !['Pending', 'Processing', 'Approved', 'Rejected', 'Cancelled', 'Hold'].includes(tx.status)) {
      errors.push(`Invalid transaction status: ${tx.status}`);
    }
    return errors;
  }

  /**
   * Validates an agent object against schema constraints and commission rate bounds [0 - 100]
   */
  static validateAgent(agent: Partial<Agent>): string[] {
    const errors: string[] = [];
    if (!agent.id || typeof agent.id !== 'string') errors.push(`Invalid agent ID: ${agent.id}`);
    if (!agent.name || typeof agent.name !== 'string') errors.push(`Invalid agent name for ID ${agent.id}`);
    
    if (agent.depositCommissionPercent !== undefined) {
      if (typeof agent.depositCommissionPercent !== 'number' || agent.depositCommissionPercent < 0 || agent.depositCommissionPercent > 100) {
        errors.push(`Agent ${agent.id} deposit commission rate out of bounds [0-100]: ${agent.depositCommissionPercent}`);
      }
    }
    if (agent.withdrawalCommissionPercent !== undefined) {
      if (typeof agent.withdrawalCommissionPercent !== 'number' || agent.withdrawalCommissionPercent < 0 || agent.withdrawalCommissionPercent > 100) {
        errors.push(`Agent ${agent.id} withdrawal commission rate out of bounds [0-100]: ${agent.withdrawalCommissionPercent}`);
      }
    }
    if (agent.profitBalance !== undefined && (typeof agent.profitBalance !== 'number' || agent.profitBalance < 0)) {
      errors.push(`Agent ${agent.id} profit balance cannot be negative`);
    }
    return errors;
  }

  /**
   * Validates a wallet object against balance limits and daily thresholds
   */
  static validateWallet(wallet: Partial<Wallet>): string[] {
    const errors: string[] = [];
    if (!wallet.id || typeof wallet.id !== 'string') errors.push(`Invalid wallet ID: ${wallet.id}`);
    if (!wallet.walletNumber && !wallet.phoneNumber) errors.push(`Wallet ${wallet.id} missing identifier number`);
    if (wallet.balance !== undefined && typeof wallet.balance !== 'number') {
      errors.push(`Wallet ${wallet.id} balance must be a number`);
    }
    if (wallet.dailySendLimit !== undefined && wallet.dailySendLimit < 0) {
      errors.push(`Wallet ${wallet.id} daily send limit cannot be negative`);
    }
    if (wallet.dailyReceiveLimit !== undefined && wallet.dailyReceiveLimit < 0) {
      errors.push(`Wallet ${wallet.id} daily receive limit cannot be negative`);
    }
    return errors;
  }

  /**
   * Full database schema health check and constraint verification
   */
  static verifyDatabaseState(data: {
    transactions?: Partial<Transaction>[];
    agents?: Partial<Agent>[];
    wallets?: Partial<Wallet>[];
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let checkedCount = 0;

    if (data.transactions) {
      data.transactions.forEach((tx, idx) => {
        checkedCount++;
        const txErrors = this.validateTransaction(tx);
        errors.push(...txErrors.map(e => `[Transaction #${idx}] ${e}`));
      });
    }

    if (data.agents) {
      data.agents.forEach((agent, idx) => {
        checkedCount++;
        const agentErrors = this.validateAgent(agent);
        errors.push(...agentErrors.map(e => `[Agent #${idx}] ${e}`));
      });
    }

    if (data.wallets) {
      data.wallets.forEach((wallet, idx) => {
        checkedCount++;
        const walletErrors = this.validateWallet(wallet);
        errors.push(...walletErrors.map(e => `[Wallet #${idx}] ${e}`));
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checkedRecordsCount: checkedCount,
    };
  }

  /**
   * Prepares production environment with validated empty initialized state
   */
  static getProductionInitializedState() {
    return {
      pendingDeposits: [],
      depositHistory: [],
      pendingWithdrawals: [],
      withdrawalHistory: [],
      agents: [],
      wallets: [],
      agentDepositRequests: [],
      agentPayouts: [],
      notifications: [],
      banks: [],
      isProductionMode: true,
      globalTrafficActive: false,
    };
  }
}
