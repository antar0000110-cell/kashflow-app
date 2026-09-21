// UZX Wallet Push Notification & Device Permission Service
// Handles Desktop Web, Mobile Web (Android/iOS), and Mobile App (PWA/Capacitor)
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageUtil, STORAGE_KEYS } from '../utils/storage';
import { soundManager } from '../utils/soundAlerts';

export type DeviceType = 'desktop' | 'mobile_web' | 'mobile_app';

export interface CachedNotificationState {
  status: 'granted' | 'denied' | 'default';
  timestamp: number;
  deviceType: DeviceType;
  promptCount: number;
}

const CACHE_STORAGE_KEY = STORAGE_KEYS.PUSH_NOTIFICATIONS_STATE;


// Audio Context Singleton for synthesized high-fidelity chimes
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a high-quality financial bell chime synthesized with Web Audio API.
 * Guaranteed zero external HTTP requests, works offline & across all browsers.
 */
export function playSynthesizedChime(type: 'success' | 'alert' | 'cash' = 'cash'): void {
  try {
    if (!soundManager.isEnabled()) return;

    const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
    if (!role || role === 'guest') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'cash' || type === 'success') {
      // Dual-tone harmonic chime (Financial ding)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12); // A6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.46);

      // Second harmonic overtone
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          const now2 = ctx.currentTime;
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1318.5, now2); // E6
          gain2.gain.setValueAtTime(0.15, now2);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.5);

          osc2.start(now2);
          osc2.stop(now2 + 0.51);
        } catch {
          // Ignore
        }
      }, 70);
    } else {
      // Alert / Urgent Warning tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.36);
    }
  } catch {
    // Browser audio policy might require initial user touch/click
  }
}

/**
 * Trigger physical haptic vibration for mobile web and mobile apps
 */
export async function triggerHaptic(type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    try {
      switch (type) {
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Fallback or ignore
    }
    return;
  }

  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      const legacyPattern = type === 'success' ? [100, 50, 100] : [100];
      navigator.vibrate(legacyPattern);
    } catch {
      // Vibration not permitted or supported on device
    }
  }
}

/**
 * Detect client device context
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  // Check if running as standalone PWA or Capacitor/Cordova app
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    (window as any).Capacitor !== undefined;

  if (isStandalone) {
    return 'mobile_app';
  }

  // Check if mobile web user agent or touch screen
  const ua = navigator.userAgent.toLowerCase();
  const isMobile =
    /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  if (isMobile) {
    return 'mobile_web';
  }

  return 'desktop';
}

/**
 * Check if the browser or platform supports Web Push / Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retrieve current permission status from browser API
 */
export function getNativePermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Read cached permission from LocalStorage.
 * If cache was cleared by the user, this returns null!
 */
export function getCachedPermissionState(): CachedNotificationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = StorageUtil.get(CACHE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedNotificationState;
  } catch {
    return null;
  }
}

/**
 * Store permission state in LocalStorage cache
 */
export function setCachedPermissionState(status: 'granted' | 'denied' | 'default'): void {
  if (typeof window === 'undefined') return;
  try {
    const currentState = getCachedPermissionState();
    const newState: CachedNotificationState = {
      status,
      timestamp: Date.now(),
      deviceType: getDeviceType(),
      promptCount: (currentState?.promptCount || 0) + 1,
    };
    StorageUtil.set(CACHE_STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error('Failed to write to notification cache', e);
  }
}

/**
 * Clear notification cache to simulate fresh visit / cleared browser data
 */
export function clearNotificationCache(): void {
  if (typeof window === 'undefined') return;
  try {
    StorageUtil.remove(CACHE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Determine if the application should prompt the user for notification permission:
 * - Returns true if:
 *    1) Cache is empty (user cleared cache or first visit), OR
 *    2) Native permission is still 'default' (not yet answered), OR
 *    3) Native permission is 'denied' and needs unblocking guide.
 */
export function shouldPromptForNotification(): boolean {
  if (!isNotificationSupported()) return false;

  const native = getNativePermission();
  const cached = getCachedPermissionState();

  // If natively granted AND cached as granted, no need to prompt
  if (native === 'granted' && cached && cached.status === 'granted') {
    return false;
  }

  // If cache is missing (first visit or cache cleared), we MUST prompt!
  if (!cached) {
    return true;
  }

  // If native is 'default', user hasn't accepted yet
  if (native === 'default') {
    return true;
  }

  return false;
}

/**
 * Register Service Worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service Worker registration skipped or failed:', err);
    return null;
  }
}

/**
 * Request notification permission from the user across Desktop, Mobile Web, and Apps.
 * Triggers native system dialogue, caches result, and dispatches welcome push if granted.
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  // If inside Capacitor App on Android/iOS, trigger native permission request
  const isNativeCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
  if (isNativeCapacitor) {
    try {
      const capPermission = await LocalNotifications.requestPermissions();
      const status = capPermission.display === 'granted' ? 'granted' : capPermission.display === 'denied' ? 'denied' : 'default';
      setCachedPermissionState(status);

      if (status === 'granted') {
        playSynthesizedChime('cash');
        triggerHaptic('success');
        
        setTimeout(() => {
          sendNativePushNotification(
            '🔔 Management OS Notifications Active',
            'Instant real-time agent notifications for orders and commissions are now active.',
            'success',
            { tag: 'welcome-notification', targetAudience: 'agent' }
          );
        }, 400);
      }
      return status;
    } catch (e) {
      console.warn('Native Capacitor local notification permission request failed:', e);
    }
  }

  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    // Register SW first or in parallel
    registerServiceWorker().catch(() => {});

    // Browser Notification.requestPermission()
    let permission: NotificationPermission;
    if (typeof Notification.requestPermission === 'function') {
      permission = await Notification.requestPermission();
    } else {
      // Legacy Safari callback pattern
      permission = await new Promise((resolve) => {
        (Notification as any).requestPermission((res: NotificationPermission) => resolve(res));
      });
    }

    // Save in Cache
    setCachedPermissionState(permission as any);

    if (permission === 'granted') {
      // Play confirmation chime & haptic
      playSynthesizedChime('cash');
      triggerHaptic('success');

      // Dispatch real Native System Push Notification
      setTimeout(() => {
        sendNativePushNotification(
          '🔔 Management OS Notifications Active',
          'Instant real-time agent notifications for orders and commissions are now active.',
          'success',
          { tag: 'welcome-notification', targetAudience: 'agent' }
        );
      }, 400);
    }

    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'default';
  }
}

/**
 * Dispatch a REAL Native System Push Notification.
 * Works on Desktop (Windows/Mac notification center), Mobile Web, and PWA/Apps.
 */
export async function sendNativePushNotification(
  title: string,
  body: string,
  type: 'success' | 'warning' | 'danger' | 'info' = 'info',
  options?: {
    tag?: string;
    url?: string;
    requireInteraction?: boolean;
    targetAgentId?: string;
    targetUserId?: string;
    targetAudience?: 'admin' | 'agent' | 'user' | 'all';
  }
): Promise<boolean> {
  const role = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
  if (!role || role === 'guest') {
    return false;
  }

  // Strict Scope Check for Agent Role
  if (role === 'agent') {
    if (options?.targetAudience === 'user') return false;
    if (options?.targetAgentId) {
      const storedAgentId = StorageUtil.get(STORAGE_KEYS.SELECTED_AGENT_ID);
      let profileAgentId: string | null = null;
      try {
        const profileStr = StorageUtil.get(STORAGE_KEYS.USER_PROFILE);
        const profile = profileStr ? JSON.parse(profileStr) : null;
        profileAgentId = profile?.agentId || null;
      } catch {}

      const currentAgentId = storedAgentId || profileAgentId;
      if (currentAgentId && options.targetAgentId !== currentAgentId) {
        // Silently ignore notification not intended for this logged-in agent
        return false;
      }
    }
  }

  // Strict Scope Check for User Role (Wallet)
  if (role === 'user') {
    if (options?.targetAudience === 'agent' || options?.targetAudience === 'admin') return false;
    if (options?.targetUserId) {
      let currentUserId: string | null = null;
      try {
        const profileStr = StorageUtil.get(STORAGE_KEYS.USER_PROFILE);
        const profile = profileStr ? JSON.parse(profileStr) : null;
        currentUserId = profile?.id || null;
      } catch {}
      if (currentUserId && options.targetUserId !== currentUserId) {
        return false;
      }
    }
  }

  // Trigger audio chime and haptic if sound enabled and targeted
  playSynthesizedChime(type === 'danger' || type === 'warning' ? 'alert' : 'cash');
  triggerHaptic(type === 'danger' ? 'error' : 'medium');

  // Check Capacitor LocalNotifications first (Native Mobile)
  const isNativeCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
  if (isNativeCapacitor) {
    try {
      const checkPermission = await LocalNotifications.checkPermissions();
      if (checkPermission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'beep.wav',
              extra: {
                url: options?.url,
              }
            }
          ]
        });
        return true;
      }
    } catch (e) {
      console.warn('Native Capacitor local notification dispatch failed:', e);
    }
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const isAgentApp = options?.targetAudience === 'agent' || title.includes('Management OS');
  const appIcon = isAgentApp ? '/management-os-icon.jpg' : '/uzx-wallet-icon.jpg';
  const appBadge = isAgentApp ? '/management-os-icon.svg' : '/uzx-wallet-icon.svg';
  const defaultTag = isAgentApp ? `management-os-${Date.now()}` : `uzx-wallet-${Date.now()}`;

  const notificationOptions = {
    body,
    icon: appIcon,
    badge: appBadge,
    tag: options?.tag || defaultTag,
    renotify: true,
    requireInteraction: options?.requireInteraction ?? (type === 'danger' || type === 'warning'),
    data: {
      url: options?.url || window.location.href,
      type,
      timestamp: Date.now(),
    },
  };

  try {
    // 1. Try Service Worker showNotification (Best for Mobile Web & Background)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions as any);
        return true;
      }
    }

    // 2. Fallback to standard window Notification (Desktop Web)
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Native notification dispatch error:', err);
    return false;
  }
}
