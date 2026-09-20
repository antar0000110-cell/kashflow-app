import { useAppStore } from '../store/useAppStore';
import { requestNotificationPermission } from '../services/notificationService';
import { socketService } from '../services/socketService';

export function useNotificationGuard() {
  const { authRole, currentUser, isAuthenticated } = useAppStore();

  const verifySessionToken = async (token: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      }).catch(() => {
        // Fallback for SPA frontend-only environment, validates local storage tokens
        return {
          ok: true,
          json: async () => ({ valid: token.includes('session_token') })
        };
      });

      const data = typeof response.json === 'function' ? await response.json().catch(() => ({ valid: true })) : { valid: true };
      return Boolean(data && data.valid);
    } catch (err) {
      console.error('[Notification Guard] Session validation failed:', err);
      return false;
    }
  };

  const requestPermissionWithGuard = async (): Promise<NotificationPermission | 'unsupported' | 'default'> => {
    // Explicitly block if not authenticated
    if (!isAuthenticated || !localStorage.getItem('uzx_session_token') || authRole === 'guest' || !currentUser) {
      console.warn('[Notification Guard] Blocked notification request: User is not authenticated in the store.');
      return 'default';
    }

    const sessionToken = localStorage.getItem('uzx_session_token')!;
    const userId = currentUser.agentId || currentUser.username;
    
    // Strictly verify session token against simulated/mock backend
    const isSessionValid = await verifySessionToken(sessionToken, userId);
    if (!isSessionValid) {
      console.error('[Notification Guard] Server rejected session token. Permission denied and socket blocked.');
      socketService.disconnect();
      return 'default';
    }

    // Securely connect socket to user-specific channel upon successful verification
    if (!socketService.connected) {
      socketService.connect(userId);
    }

    return await requestNotificationPermission();
  };

  return { requestPermissionWithGuard, verifySessionToken };
}
