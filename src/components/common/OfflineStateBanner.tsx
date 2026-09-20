import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineStateBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-xs font-bold text-center justify-center sticky top-0 z-[100] shadow-md"
        >
          <WifiOff className="w-4 h-4" />
          <span>لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة لتجنب فقدان البيانات.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
