import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Custom hook to handle Capacitor-specific app logic like Status Bar styling,
 * SplashScreen hiding, and hardware Back Button behavior.
 */
export const useNativeApp = () => {
  useEffect(() => {
    // 1. Check if running in a native environment
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor;

    if (isNative) {
      // 2. Hide Splash Screen after app loads
      SplashScreen.hide().catch(() => {});

      // 3. Style the Status Bar (Financial app: deep red or white)
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#8B1E2D' }).catch(() => {});

      // 4. Handle Hardware Back Button (Android)
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }

    return () => {
      if (isNative) {
        CapApp.removeAllListeners();
      }
    };
  }, []);
};
