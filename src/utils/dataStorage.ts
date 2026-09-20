/**
 * Utility function to wipe all client-side application data
 * (localStorage and sessionStorage) to ensure a clean slate
 * for the production transition.
 */
export function clearAllAppData(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('[UZX System] LocalStorage and SessionStorage wiped successfully for clean initialization.');
  } catch (error) {
    console.error('[UZX System] Failed to clear application data:', error);
  }
}
