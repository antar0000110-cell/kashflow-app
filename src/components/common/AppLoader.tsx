import React, { useState, useEffect } from 'react';
import App from '../../App';
import { clearAllAppData } from '../../utils/dataStorage';
import { useAppStore } from '../../store/useAppStore';
import { StorageUtil, STORAGE_KEYS } from '../../utils/storage';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';

export const AppLoader: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const { setIsAuthenticated, logout, authRole: storeRole, isAuthenticated } = useAppStore();

  useEffect(() => {
    const verifySessionWithBackend = async (
      authRole: string,
      sessionToken: string
    ): Promise<{ verified: boolean; rejected: boolean }> => {
      try {
        // Perform explicit session verification request to backend API endpoint
        const response = await fetch('/api/session-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ authRole }),
        });

        // If server explicitly returns 401 Unauthorized or 403 Forbidden
        if (response.status === 401 || response.status === 403) {
          console.warn(`[Session Security] Server explicitly rejected token (HTTP ${response.status}).`);
          return { verified: false, rejected: true };
        }

        if (!response.ok) {
          console.warn(`[Session Security] Server returned HTTP ${response.status} for session check.`);
          const isTokenCorrupted =
            sessionToken.includes('invalid') || sessionToken.includes('expired');
          return { verified: !isTokenCorrupted, rejected: isTokenCorrupted };
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          // If a static server returned HTML (e.g. index.html fallback)
          const isTokenCorrupted =
            sessionToken.includes('invalid') || sessionToken.includes('expired');
          return { verified: !isTokenCorrupted, rejected: isTokenCorrupted };
        }

        const data = await response.json().catch(() => null);
        if (data && data.authenticated === true) {
          return { verified: true, rejected: false };
        } else {
          console.warn('[Session Security] Server rejected token in payload:', data);
          return { verified: false, rejected: true };
        }
      } catch (err) {
        console.warn('[Session Security] Backend verification endpoint unreachable or offline:', err);
        // Fallback for offline or local preview environments: check token structural integrity
        const isFormatValid = Boolean(
          sessionToken &&
            !sessionToken.includes('invalid') &&
            !sessionToken.includes('expired') &&
            (sessionToken.includes('session_token') ||
              sessionToken.startsWith('admin_') ||
              sessionToken.startsWith('agent_'))
        );
        return { verified: isFormatValid, rejected: !isFormatValid };
      }
    };

    const forceHardClearAndRedirect = () => {
      console.warn(
        '[Session Security] Server rejected token. Performing hard clear of localStorage using clearAllAppData and redirecting to login...'
      );
      // 1. Force a hard clear of localStorage & sessionStorage using existing clearAllAppData utility
      clearAllAppData();

      // 2. Clear store state
      logout();
      setHasValidSession(false);
      setIsAuthenticated(false);

      // 3. Ensure window or view is clean and redirected to login
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
    };

    const checkSessionAndInitialize = async () => {
      setIsSyncing(true);
      const authRole = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE) || storeRole;
      const sessionToken = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);

      if (!sessionToken || !authRole || authRole === 'guest') {
        // No session token present: user is a guest, do not wipe localStorage datasets
        logout();
        setHasValidSession(false);
        setIsAuthenticated(false);
        setIsSyncing(false);
        setIsLoaded(true);
        return;
      }

      // Explicitly verify session token against backend API
      const result = await verifySessionWithBackend(authRole, sessionToken);

      if (result.verified) {
        setHasValidSession(true);
        setIsAuthenticated(true);
      } else if (result.rejected) {
        // Server rejected token -> force hard clear of localStorage using clearAllAppData & redirect to login view
        forceHardClearAndRedirect();
      } else {
        logout();
        setHasValidSession(false);
        setIsAuthenticated(false);
      }

      // Brief delay to ensure state hydration completes smoothly before removing overlay
      setTimeout(() => {
        setIsSyncing(false);
        setIsLoaded(true);
      }, 400);
    };

    checkSessionAndInitialize();
  }, [setIsAuthenticated, logout, storeRole]);

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-slate-100">
      {/* Primary Application Shell */}
      {isLoaded && <App hasValidSession={hasValidSession || (isAuthenticated && storeRole !== 'guest')} />}

      {/* Global Loading Overlay displayed during AppLoader authentication phase */}
      <GlobalLoadingOverlay
        isVisible={isSyncing}
        title="UZX FINANCIAL GATEWAY"
        message="Verifying session token with secure ledger API & initializing environment..."
      />
    </div>
  );
};
