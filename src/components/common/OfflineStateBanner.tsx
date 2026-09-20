import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineStateBannerProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const OfflineStateBanner: React.FC<OfflineStateBannerProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      onStatusChange?.(true);
      setTimeout(() => {
        setShowBanner(false);
        setJustReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setJustReconnected(false);
      onStatusChange?.(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  if (!showBanner && !justReconnected) return null;

  return (
    <div
      className={`mx-4 mt-2 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
        justReconnected
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          : 'bg-amber-50 border border-amber-200 text-amber-700'
      }`}
    >
      {justReconnected ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Connection restored. You can resume transactions.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>No internet connection. Transactions are paused.</span>
        </>
      )}
    </div>
  );
};
