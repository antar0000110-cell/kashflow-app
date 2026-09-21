/**
 * Unified LocalStorage Key Management Utility
 * Standardizes storage keys to prevent collisions and overwrite issues.
 */

export const STORAGE_KEYS = {
  // Authentication & Session (Main App)
  AUTH_ROLE: 'uzx_auth_role',
  SESSION_TOKEN: 'uzx_session_token',
  USER_PROFILE: 'uzx_user_profile',
  LAST_USERNAME: 'uzx_last_username',
  SELECTED_AGENT_ID: 'uzx_selected_agent_id',
  ACTIVE_PORTAL: 'uzx_active_portal',
  ACTIVE_SECTION: 'uzx_active_section',

  // Persisted Store Data
  PERSISTED_BANKS: 'uzx_persisted_banks',
  PERSISTED_PENDING_DEPOSITS: 'uzx_persisted_pendingDeposits',
  PERSISTED_DEPOSIT_HISTORY: 'uzx_persisted_depositHistory',
  PERSISTED_PENDING_WITHDRAWALS: 'uzx_persisted_pendingWithdrawals',
  PERSISTED_WITHDRAWAL_HISTORY: 'uzx_persisted_withdrawalHistory',
  PERSISTED_AGENTS: 'uzx_persisted_agents',
  PERSISTED_WALLETS: 'uzx_persisted_wallets',
  PERSISTED_AGENT_DEPOSIT_REQUESTS: 'uzx_persisted_agentDepositRequests',
  PERSISTED_AGENT_PAYOUTS: 'uzx_persisted_agentPayouts',
  PERSISTED_WALLET_TEMPLATE: 'uzx_persisted_walletTemplate',
  PERSISTED_DISPUTES: 'uzx_persisted_disputes',
  PERSISTED_IS_PRODUCTION_MODE: 'uzx_persisted_isProductionMode',
  PERSISTED_COMMISSION_RATES: 'uzx_persisted_commissionRates',
  PERSISTED_DOMAIN_SETTINGS: 'uzx_persisted_domainSettings',
  APP_STORE_PERSISTENCE: 'uzx_app_store_state',

  // Push notifications
  PUSH_NOTIFICATIONS_STATE: 'uzx_push_notifications_state',

  // Wallet App Keys (Kashflow APK simulation)
  KASHFLOW_LOGGED_IN: 'kashflow_wallet_is_logged_in',
  KASHFLOW_ACTIVE_NUMBER: 'kashflow_wallet_active_number',
  KASHFLOW_SESSION_EXPIRY: 'kashflow_wallet_session_expiry',
  KASHFLOW_LAST_ACTIVITY: 'kashflow_wallet_last_activity',
  KASHFLOW_SAVED_WALLETS: 'kashflow_saved_wallets',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Utility functions for clean and type-safe storage access
 */
export const StorageUtil = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[StorageUtil] Error getting key "${key}":`, e);
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[StorageUtil] Error setting key "${key}":`, e);
    }
  },

  getObject<T>(key: string, fallback: T): T {
    const value = this.get(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  },

  setObject(key: string, value: any): void {
    this.set(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[StorageUtil] Error removing key "${key}":`, e);
    }
  },

  clearSensitiveSession(): void {
    this.remove(STORAGE_KEYS.AUTH_ROLE);
    this.remove(STORAGE_KEYS.SESSION_TOKEN);
    this.remove(STORAGE_KEYS.USER_PROFILE);
    this.remove(STORAGE_KEYS.SELECTED_AGENT_ID);
    this.remove(STORAGE_KEYS.ACTIVE_PORTAL);
    this.remove(STORAGE_KEYS.ACTIVE_SECTION);
    console.log('[StorageUtil] Sensitive session data cleared securely.');
  }
};
