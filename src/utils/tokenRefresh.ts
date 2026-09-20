import { StorageUtil, STORAGE_KEYS } from './storage';

let refreshTimer: any = null;
let refreshPromise: Promise<boolean> | null = null;
let logoutHandler: (() => void) | null = null;

/**
 * Register a callback to execute when refresh fails permanently and user must be logged out.
 */
export function setOnRefreshLogout(callback: () => void) {
  logoutHandler = callback;
}

/**
 * Safely decodes JWT payload using built-in atob without external dependencies.
 */
export function decodeJWT(token: string): { exp?: number; iat?: number; [key: string]: any } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

/**
 * Calls POST /api/auth/refresh with the current token, stores the new token in localStorage.
 * Handles concurrency so multiple triggers await the single active refresh request.
 */
export async function refreshToken(): Promise<boolean> {
  // If already refreshing, reuse the in-flight promise to prevent concurrent duplicate calls
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentToken = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
  if (!currentToken) {
    stopAutoRefresh();
    return false;
  }

  // Safety check: NEVER auto-refresh if token is already expired
  const decoded = decodeJWT(currentToken);
  if (!decoded || !decoded.exp) {
    stopAutoRefresh();
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (decoded.exp <= nowSeconds) {
    console.warn('[TokenRefresh] Token is already expired. Refresh aborted.');
    stopAutoRefresh();
    triggerLogout();
    return false;
  }

  refreshPromise = (async () => {
    try {
      console.log('[TokenRefresh] Sending refresh request to /api/auth/refresh...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        console.warn(`[TokenRefresh] Server returned status ${response.status}. Refresh failed.`);
        triggerLogout();
        return false;
      }

      const data = await response.json();
      if (data.success && data.token) {
        console.log('[TokenRefresh] Token successfully refreshed with a fresh 7-day validity.');
        StorageUtil.set(STORAGE_KEYS.SESSION_TOKEN, data.token);
        if (data.user) {
          StorageUtil.setObject(STORAGE_KEYS.USER_PROFILE, data.user);
        }

        // Schedule next refresh cycle with the new token
        scheduleTokenRefresh();
        return true;
      }

      triggerLogout();
      return false;
    } catch (err) {
      console.error('[TokenRefresh] Network or execution error during token refresh:', err);
      // For network disconnects, don't necessarily logout immediately unless required by status
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Calculates when the current token expires (decode JWT exp claim),
 * and schedules a refresh request 1 day (24 hours) before expiry.
 */
export function scheduleTokenRefresh(): void {
  // Clear any previously pending schedule
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const currentToken = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
  if (!currentToken) {
    return;
  }

  const decoded = decodeJWT(currentToken);
  if (!decoded || !decoded.exp) {
    return;
  }

  const nowMs = Date.now();
  const expMs = decoded.exp * 1000;

  // Safety rule: never schedule if already expired
  if (expMs <= nowMs) {
    console.warn('[TokenRefresh] Current token is already expired.');
    return;
  }

  // Target time: 1 day (24 hours) before expiry
  const oneDayMs = 24 * 60 * 60 * 1000;
  const refreshTargetTime = expMs - oneDayMs;
  let delayMs = refreshTargetTime - nowMs;

  // If less than 1 day remains until expiration, schedule refresh shortly (e.g. 5 seconds)
  if (delayMs <= 0) {
    delayMs = 5000;
  }

  // Clamp to max 32-bit signed int for setTimeout (~24.8 days)
  const maxDelay = 2147483647;
  const safeDelay = Math.min(delayMs, maxDelay);

  console.log(
    `[TokenRefresh] Next token refresh scheduled in ${Math.round(safeDelay / 1000 / 60)} minutes (at ${new Date(
      nowMs + safeDelay
    ).toLocaleString()})`
  );

  refreshTimer = setTimeout(async () => {
    refreshTimer = null;
    await refreshToken();
  }, safeDelay);
}

/**
 * Called once when app initializes or after successful login, sets up the refresh timer.
 */
export function startAutoRefresh(): void {
  scheduleTokenRefresh();
}

/**
 * Clears the timer on logout or authentication rejection.
 */
export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Helper to force logout and clean up state when token refresh fails permanently.
 */
function triggerLogout(): void {
  stopAutoRefresh();
  if (logoutHandler) {
    try {
      logoutHandler();
    } catch (err) {
      console.error('[TokenRefresh] Error executing logoutHandler:', err);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('uzx:auth-failure'));
  }
}
