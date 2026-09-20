import { StorageUtil } from './storage';

/**
 * Utility function to perform a hard clear of all client-side application storage data
 * (localStorage and sessionStorage) securely.
 */
export function clearAllAppData(): void {
  try {
    StorageUtil.clearSensitiveSession();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    console.log('[UZX System] All client-side storage forcibly cleared.');
  } catch (error) {
    console.error('[UZX System] Failed to clear application data:', error);
  }
}
