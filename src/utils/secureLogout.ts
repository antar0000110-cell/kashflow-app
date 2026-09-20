import { StorageUtil, STORAGE_KEYS } from './storage';

/**
 * SecureLogout Utility
 * Manages secure financial session states, inactivity timeouts,
 * and forces re-authentication when the 5-minute session boundary is reached or when inactive.
 */
export const SecureLogout = {
  SESSION_KEY: STORAGE_KEYS.KASHFLOW_SESSION_EXPIRY,
  LAST_ACTIVITY_KEY: STORAGE_KEYS.KASHFLOW_LAST_ACTIVITY,
  SESSION_DURATION: 5 * 60 * 1000, // 5 minutes standard maximum session duration

  /**
   * Initializes a fresh secure session.
   */
  initSession(): void {
    const expiresAt = Date.now() + this.SESSION_DURATION;
    try {
      StorageUtil.set(this.SESSION_KEY, expiresAt.toString());
      StorageUtil.set(this.LAST_ACTIVITY_KEY, Date.now().toString());
      StorageUtil.set(STORAGE_KEYS.KASHFLOW_LOGGED_IN, 'true');
    } catch (e) {
      console.warn('LocalStorage error during session initialization', e);
    }
  },

  /**
   * Registers user interaction, extending the relative inactivity timer within boundaries.
   */
  updateActivity(): void {
    try {
      const isLoggedIn = StorageUtil.get(STORAGE_KEYS.KASHFLOW_LOGGED_IN) === 'true';
      if (isLoggedIn) {
        StorageUtil.set(this.LAST_ACTIVITY_KEY, Date.now().toString());
      }
    } catch (e) {
      console.warn('LocalStorage error during activity update', e);
    }
  },

  /**
   * Determines if the current session has expired either from absolute 5-minute limit or inactivity.
   */
  checkSessionExpired(): boolean {
    try {
      const isLoggedIn = StorageUtil.get(STORAGE_KEYS.KASHFLOW_LOGGED_IN) === 'true';
      if (!isLoggedIn) return false;

      // 1. Check absolute session expiry (5-minute max lifetime)
      const expiryStr = StorageUtil.get(this.SESSION_KEY);
      if (!expiryStr) {
        this.initSession();
        return false;
      }
      const expiresAt = parseInt(expiryStr, 10);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return true;
      }

      // 2. Check maximum inactivity inactivity timeout (e.g. 3 minutes idle)
      const lastActivityStr = StorageUtil.get(this.LAST_ACTIVITY_KEY);
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        const maxIdleTime = 3 * 60 * 1000; // 3 minutes maximum idle duration
        if (!isNaN(lastActivity) && (Date.now() - lastActivity) > maxIdleTime) {
          return true;
        }
      }
    } catch (e) {
      // safe fallback
    }
    return false;
  },

  /**
   * Clears session and login flag completely from localStorage to trigger absolute logout.
   */
  forceLogout(): void {
    try {
      StorageUtil.remove(STORAGE_KEYS.KASHFLOW_LOGGED_IN);
      StorageUtil.remove(STORAGE_KEYS.KASHFLOW_ACTIVE_NUMBER);
      StorageUtil.remove(this.SESSION_KEY);
      StorageUtil.remove(this.LAST_ACTIVITY_KEY);
    } catch (e) {
      console.warn('LocalStorage clear error', e);
    }
  }
};

