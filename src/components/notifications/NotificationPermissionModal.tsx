import React, { useEffect } from 'react';
import { shouldPromptForNotification } from '../../services/notificationService';
import { useAppStore } from '../../store/useAppStore';
import { useNotificationGuard } from '../../hooks/useNotificationGuard';

interface NotificationPermissionModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  forceOpen,
  onClose,
}) => {
  const { authRole, currentUser, isAuthenticated } = useAppStore();
  const { requestPermissionWithGuard } = useNotificationGuard();

  useEffect(() => {
    // If not authenticated (guest, no user, or isAuthenticated is false), strictly do not invoke notification logic
    if (authRole === 'guest' || !currentUser || !isAuthenticated) {
      return;
    }

    if (forceOpen) {
      requestPermissionWithGuard().finally(() => {
        if (onClose) onClose();
      });
      return;
    }

    // Only register listeners if browser supports notifications and we need to prompt
    if (!shouldPromptForNotification()) {
      return;
    }

    const triggerNativePermission = async () => {
      // Unsubscribe immediately to prevent repeated prompts on subsequent clicks
      cleanupListeners();

      try {
        await requestPermissionWithGuard();
      } catch (err) {
        console.error('Failed to request native notification permission with guard:', err);
      }
    };

    const events = ['click', 'touchstart', 'keydown', 'mousedown'];

    const addListeners = () => {
      events.forEach((event) => {
        window.addEventListener(event, triggerNativePermission, { once: true, passive: true });
      });
    };

    const cleanupListeners = () => {
      events.forEach((event) => {
        window.removeEventListener(event, triggerNativePermission);
      });
    };

    addListeners();

    return () => {
      cleanupListeners();
    };
  }, [forceOpen, onClose, authRole, currentUser, isAuthenticated, requestPermissionWithGuard]);

  if (authRole === 'guest' || !currentUser || !isAuthenticated) {
    return null;
  }

  return null;
};
