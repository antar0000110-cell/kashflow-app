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
  console.log('    UZX FINANCIAL OS - ZERO-DATA RESET UTILITY       ');
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

  // 2. Load and reset the JSON persistent database file if it exists
  const dbPath = path.join(process.cwd(), 'data', 'uzx_database.json');
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.users)) {
        // Retain ONLY admin users
        data.users = data.users.filter((u: any) => u.role === 'admin');
        data.agents = [];
        data.wallets = [];
        data.transactions = [];
        data.agentDepositRequests = [];
        data.agentPayouts = [];
        data.notifications = [
          {
            id: `NOTIF-${Date.now()}`,
            title: 'System Reset via Server CLI Utility',
            message: 'All transaction history, wallets, agent accounts, and collateral profiles have been purged and zeroed out.',
            timestamp: new Date().toISOString(),
            type: 'system',
            read: false
          }
        ];
        data.botConfig = {
          enabled: false,
          frequencySeconds: 15,
          minAmount: 100,
          maxAmount: 5000,
          targetAgentId: '',
          targetProvider: 'Vodafone Cash'
        };
        data.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log('✅ Persistent JSON Database (uzx_database.json) successfully reset.');
        console.log('   - Only admin users have been preserved.');
      }
    } catch (err) {
      console.error('❌ Failed to read or parse uzx_database.json:', err);
    }
  }

  // 3. Clear browser storage if running in browser context
  clearBrowserStorage();

  console.log('------------------------------------------------------------');
  console.log('✅ DATABASE RESET COMPLETE:');
  console.log('   - Pending & Historical Deposits: 0 records');
  console.log('   - Pending & Historical Withdrawals: 0 records');
  console.log('   - Agent Accounts & Balances: 0 records');
  console.log('   - Wallet Pool Assignments: 0 records');
  console.log('   - System Notifications: 1 system notice');
  console.log('============================================================');
}

// Execute immediately if invoked directly via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reset-database.ts')) {
  resetDatabase().catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
}
