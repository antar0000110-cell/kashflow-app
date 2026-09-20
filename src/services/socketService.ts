// UZX Wallet Real-Time WebSocket Service
// Connects to real backend WebSocket server with room-based pub/sub

import { StorageUtil, STORAGE_KEYS } from '../utils/storage';

export interface SocketClient {
  connected: boolean;
  socketId: string;
  subscriptions: Set<string>;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  disconnect: () => void;
}

class RealtimeSocketService implements SocketClient {
  public connected: boolean = false;
  public socketId: string = '';
  public subscriptions: Set<string> = new Set();
  private ws: WebSocket | null = null;
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};
  private reconnectTimeout: any = null;
  private currentUserId: string = '';

  public connect(userId: string, sessionToken?: string) {
    this.currentUserId = userId;
    const token = sessionToken || StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);

    if (typeof window === 'undefined') return;

    // Close any previous connection
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token || '')}`;

      console.log(`[Realtime WebSocket] Connecting to ${wsUrl}...`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.socketId = `ws_${Date.now()}`;
        console.log(`[Realtime WebSocket] Connected successfully. Assigned socket ID: ${this.socketId}`);
        
        // Join user room
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'join', room: userId }));
          this.subscriptions.add(userId);
        }

        this.triggerListeners('connect', { socketId: this.socketId });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type) {
            this.triggerListeners(payload.type, payload.data || payload);
          }
        } catch (err) {
          console.warn('[Realtime WebSocket] Received non-JSON frame:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log('[Realtime WebSocket] Disconnected.');
        this.triggerListeners('disconnect');

        // Auto reconnect after 3 seconds if user still logged in
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          const activeRole = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
          if (activeRole && activeRole !== 'guest') {
            this.connect(this.currentUserId);
          }
        }, 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime WebSocket] Connection error:', err);
      };
    } catch (err) {
      console.error('[Realtime WebSocket] Failed to initialize WebSocket:', err);
    }
  }

  public emit(event: string, ...args: any[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, payload: args }));
    }
    if (event === 'join') {
      const room = args[0];
      this.subscriptions.add(room);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  private triggerListeners(event: string, ...args: any[]) {
    const list = this.listeners[event] || [];
    list.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[Realtime WebSocket] Error executing listener for "${event}":`, err);
      }
    });
  }

  public triggerLocalScopedNotification(targetUserId: string, notificationData: any) {
    this.triggerListeners('notification', notificationData);
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.connected = false;
    this.subscriptions.clear();
  }
}

export const socketService = new RealtimeSocketService();
