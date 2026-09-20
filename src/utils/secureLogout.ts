/**
 * SecureLogout Utility
 * Manages secure financial session states, inactivity timeouts,
 * and forces re-authentication when the 5-minute session boundary is reached or when inactive.
 */
export const SecureLogout = {
  SESSION_KEY: 'kashflow_wallet_session_expiry',
  LAST_ACTIVITY_KEY: 'kashflow_wallet_last_activity',
  SESSION_DURATION: 5 * 60 * 1000, // 5 minutes standard maximum session duration

  /**
   * Initializes a fresh secure session.
   */
  initSession(): void {
    const expiresAt = Date.now() + this.SESSION_DURATION;
    try {
      localStorage.setItem(this.SESSION_KEY, expiresAt.toString());
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.setItem('kashflow_wallet_is_logged_in', 'true');
    } catch (e) {
      console.warn('LocalStorage error during session initialization', e);
    }
  },

  /**
   * Registers user interaction, extending the relative inactivity timer within boundaries.
   */
  updateActivity(): void {
    try {
      const isLoggedIn = localStorage.getItem('kashflow_wallet_is_logged_in') === 'true';
      if (isLoggedIn) {
        localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
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
      const isLoggedIn = localStorage.getItem('kashflow_wallet_is_logged_in') === 'true';
      if (!isLoggedIn) return false;

      // 1. Check absolute session expiry (5-minute max lifetime)
      const expiryStr = localStorage.getItem(this.SESSION_KEY);
      if (!expiryStr) {
        this.initSession();
        return false;
      }
      const expiresAt = parseInt(expiryStr, 10);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return true;
      }

      // 2. Check maximum inactivity inactivity timeout (e.g. 3 minutes idle)
      const lastActivityStr = localStorage.getItem(this.LAST_ACTIVITY_KEY);
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
      localStorage.removeItem('kashflow_wallet_is_logged_in');
      localStorage.removeItem('kashflow_wallet_active_number');
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    } catch (e) {
      console.warn('LocalStorage clear error', e);
    }
  }
};
