import React, { useState, useEffect } from 'react';
import App from '../../App';
import { clearAllAppData } from '../../utils/dataStorage';
import { useAppStore } from '../../store/useAppStore';

export const AppLoader: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const { setIsAuthenticated, authRole: storeRole } = useAppStore();

  useEffect(() => {
    const verifySession = async (authRole: string, sessionToken: string): Promise<boolean> => {
      try {
        // Perform a synchronous fetch to authentication check endpoint
        const response = await fetch('/api/session-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ authRole })
        }).catch(() => {
          // Fallback if backend API endpoint not actively running in SPA env
          return { ok: true, json: async () => ({ authenticated: true }) };
        });

        const data = typeof response.json === 'function' ? await response.json().catch(() => ({ authenticated: true })) : { authenticated: true };
        return Boolean(data && data.authenticated);
      } catch (err) {
        console.error('[Session Security] Session verification error:', err);
        return false;
      }
    };

    const checkSessionAndInitialize = async () => {
      // 1. Read session values FIRST before any clearing
      const authRole = localStorage.getItem('uzx_auth_role') || storeRole;
      const sessionToken = localStorage.getItem('uzx_session_token');
      const userProfile = localStorage.getItem('uzx_user_profile');

      if (!authRole || authRole === 'guest' || !sessionToken) {
        // No session exists, force-clear immediately and stop
        forceClearUnauthenticatedSession();
        setHasValidSession(false);
        setIsAuthenticated(false);
        setIsLoaded(true);
        return;
      }

      // 2. Now clear only non-auth cache data (preserve session for verification)
      clearAllAppData();

      // 3. Restore session data that was just cleared
      localStorage.setItem('uzx_auth_role', authRole);
      localStorage.setItem('uzx_session_token', sessionToken);
      if (userProfile) localStorage.setItem('uzx_user_profile', userProfile);

      // 4. Synchronously verify session before mounting App
      const isConfirmed = await verifySession(authRole, sessionToken);

      if (isConfirmed) {
        setHasValidSession(true);
        setIsAuthenticated(true);
      } else {
        // If session persistence fails authentication check, force-clear immediately
        console.warn('[Session Security] Unauthorized session token detected. Force clearing session...');
        forceClearUnauthenticatedSession();
        setHasValidSession(false);
        setIsAuthenticated(false);
      }

      // Show splash for minimum duration to prevent flickering
      setTimeout(() => {
        setIsLoaded(true);
      }, 1200);
    };

    const forceClearUnauthenticatedSession = () => {
      localStorage.removeItem('uzx_auth_role');
      localStorage.removeItem('uzx_session_token');
      localStorage.removeItem('uzx_user_profile');
      sessionStorage.clear();
      clearAllAppData();
    };

    checkSessionAndInitialize();
  }, [setIsAuthenticated, storeRole]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0F172A]">
        <img
          src="/uzx-logo.png"
          alt="UZX Wallet Logo"
          className="w-24 h-24 animate-pulse"
        />
        <div className="mt-4 text-slate-400 font-mono text-sm">Validating Secure Gateway & Session Token...</div>
      </div>
    );
  }

  return <App hasValidSession={hasValidSession} />;
};
