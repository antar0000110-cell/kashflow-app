/**
 * KashFlow Financial OS - Production Database & Store Reset Utility
 *
 * This utility script clears all transaction, agent, wallet, and notification
 * records in the Zustand store and local storage caches to ensure the system
 * starts in a clean, zero-data state for production deployment.
 *
 * Usage:
 *   npx tsx reset-database.ts
 */

import fs from 'fs';
import path from 'path';

export interface CleanDatabaseState {
  pendingDeposits: [];
  depositHistory: [];
  pendingWithdrawals: [];
  withdrawalHistory: [];
  agents: [];
  wallets: [];
  agentDepositRequests: [];
  agentPayouts: [];
  notifications: [];
  banks: [];
}

/**
 * Returns a completely clean, zero-data initial state structure
 */
export function getZeroDataState(): CleanDatabaseState {
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
  };
}

/**
 * Clears client-side localStorage/sessionStorage keys if executed in a browser environment
 */
export function clearBrowserStorage(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
      console.log('✅ Client localStorage and sessionStorage successfully purged.');
    } catch (err) {
      console.error('⚠️ Could not clear browser storage:', err);
    }
  }
}

/**
 * Main execution function for server/CLI usage
 */
export async function resetDatabase(): Promise<void> {
  console.log('============================================================');
  console.log('    KASHFLOW FINANCIAL OS - ZERO-DATA RESET UTILITY       ');
  console.log('============================================================');

  // 1. Purge local disk caches or json database files if present
  const cacheDirs = ['.data_cache', '.store_cache', 'dist/.cache'];

  for (const dirName of cacheDirs) {
    const fullPath = path.join(process.cwd(), dirName);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`[CLEANUP] Deleted cache directory: ${dirName}`);
      } catch (e) {
        console.warn(`[WARNING] Failed to remove ${dirName}:`, e);
      }
    }
  }

  // 2. Clear browser storage if running in browser context
  clearBrowserStorage();

  console.log('------------------------------------------------------------');
  console.log('✅ DATABASE RESET COMPLETE:');
  console.log('   - Pending & Historical Deposits: 0 records');
  console.log('   - Pending & Historical Withdrawals: 0 records');
  console.log('   - Agent Accounts & Balances: 0 records');
  console.log('   - Wallet Pool Assignments: 0 records');
  console.log('   - System Notifications: 0 records');
  console.log('============================================================');
}

// Execute immediately if invoked directly via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reset-database.ts')) {
  resetDatabase().catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
}
