import React, { useEffect } from 'react';
import {
  shouldPromptForNotification,
  requestNotificationPermission
} from '../../services/notificationService';

interface NotificationPermissionModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  forceOpen,
  onClose,
}) => {
  useEffect(() => {
    if (forceOpen) {
      requestNotificationPermission().finally(() => {
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
        await requestNotificationPermission();
      } catch (err) {
        console.error('Failed to request native notification permission:', err);
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

    // Also attempt a non-blocking immediate trigger if permitted by user/browser environment
    const immediateTimer = setTimeout(() => {
      if (shouldPromptForNotification()) {
        requestNotificationPermission().catch(() => {});
      }
    }, 1500);

    return () => {
      cleanupListeners();
      clearTimeout(immediateTimer);
    };
  }, [forceOpen, onClose]);

  return null;
};
