// UZX Wallet Real-Time WebSocket Service
// Connects to real backend WebSocket server with room-based pub/sub and agent-isolated subscription filtering

import { StorageUtil, STORAGE_KEYS } from '../utils/storage';

export interface TransactionSubscriptionOptions {
  agentId?: string;
  allowBroadcasts?: boolean;
}

export interface SocketSubscriber {
  id: string;
  event: string;
  callback: (...args: any[]) => void;
  filterOptions?: TransactionSubscriptionOptions;
}

export interface SocketClient {
  connected: boolean;
  socketId: string;
  subscriptions: Set<string>;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void, options?: TransactionSubscriptionOptions) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  subscribe: (event: string, callback: (...args: any[]) => void, options?: TransactionSubscriptionOptions) => () => void;
  subscribeToTransactionCreated: (
    callback: (transaction: any) => void,
    optionsOrAgentId?: string | TransactionSubscriptionOptions
  ) => () => void;
  disconnect: () => void;
}

class RealtimeSocketService implements SocketClient {
  public connected: boolean = false;
  public isPaused: boolean = false;
  public socketId: string = '';

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    console.log(`[Realtime WebSocket] Real-time sync set to: ${paused ? 'PAUSED' : 'ACTIVE'}`);
  }
  public subscriptions: Set<string> = new Set();

  private ws: WebSocket | null = null;
  private subscribers: SocketSubscriber[] = [];
  private reconnectTimeout: any = null;

  private currentUserId: string = '';
  private authenticatedAgentId: string | null = null;
  private authenticatedRole: 'admin' | 'agent' | 'guest' | null = null;

  /**
   * Configure the currently authenticated agent/user identity for strict event filtering
   */
  public setAuthenticatedAgent(agentId: string | null, role?: 'admin' | 'agent' | 'guest' | string) {
    this.authenticatedAgentId = agentId || null;
    if (role) {
      this.authenticatedRole = role as 'admin' | 'agent' | 'guest';
    } else if (agentId) {
      this.authenticatedRole = 'agent';
    }
  }

  public getAuthenticatedAgentId(): string | null {
    if (this.authenticatedAgentId) return this.authenticatedAgentId;
    const storedRole = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
    if (storedRole === 'agent') {
      const storedAgentId = StorageUtil.get(STORAGE_KEYS.SELECTED_AGENT_ID);
      if (storedAgentId) return storedAgentId;
      try {
        const profileStr = StorageUtil.get(STORAGE_KEYS.USER_PROFILE);
        const profile = profileStr ? JSON.parse(profileStr) : null;
        return profile?.agentId || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  public getAuthenticatedRole(): 'admin' | 'agent' | 'guest' | null {
    if (this.authenticatedRole) return this.authenticatedRole;
    const storedRole = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE) as 'admin' | 'agent' | 'guest' | null;
    return storedRole || null;
  }

  public connect(userId: string, sessionToken?: string, role?: string) {
    this.currentUserId = userId;
    const token = sessionToken || StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
    const activeRole = role || StorageUtil.get(STORAGE_KEYS.AUTH_ROLE) || (userId === 'admin' ? 'admin' : 'agent');

    if (activeRole === 'agent' || userId.startsWith('AGT-') || (userId !== 'admin' && activeRole !== 'admin')) {
      this.authenticatedAgentId = userId;
      this.authenticatedRole = 'agent';
    } else if (activeRole === 'admin' || userId === 'admin') {
      this.authenticatedAgentId = null;
      this.authenticatedRole = 'admin';
    }

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

      console.log(`[Realtime WebSocket] Connecting to ${wsUrl} (User: ${userId}, Role: ${this.authenticatedRole})...`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.socketId = `ws_${Date.now()}`;
        console.log(`[Realtime WebSocket] Connected successfully. Assigned socket ID: ${this.socketId}`);

        // Join user room
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'join', room: userId }));
          this.subscriptions.add(userId);

          if (this.authenticatedAgentId) {
            this.ws.send(JSON.stringify({ type: 'join', room: `agent:${this.authenticatedAgentId}` }));
            this.subscriptions.add(`agent:${this.authenticatedAgentId}`);
          }
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

        // Auto reconnect after 3 seconds if user is still logged in
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          const activeRoleNow = StorageUtil.get(STORAGE_KEYS.AUTH_ROLE);
          if (activeRoleNow && activeRoleNow !== 'guest') {
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

  /**
   * Registers a listener on a given event, with optional transaction filtering options
   */
  public on(
    event: string,
    callback: (...args: any[]) => void,
    options?: TransactionSubscriptionOptions
  ) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.subscribers.push({
      id,
      event,
      callback,
      filterOptions: options,
    });
  }

  public off(event: string, callback: (...args: any[]) => void) {
    this.subscribers = this.subscribers.filter(
      (sub) => !(sub.event === event && sub.callback === callback)
    );
  }

  /**
   * Clean subscription API that returns an unbind/unsubscribe callback
   */
  public subscribe(
    event: string,
    callback: (...args: any[]) => void,
    options?: TransactionSubscriptionOptions
  ): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sub: SocketSubscriber = {
      id,
      event,
      callback,
      filterOptions: options,
    };
    this.subscribers.push(sub);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s.id !== id);
    };
  }

  /**
   * Helper to extract the associated agent ID from any transaction or event payload
   */
  private extractAgentId(payload: any): string | null {
    if (!payload) return null;
    const tx = payload.transaction || payload.data?.transaction || payload.data || payload;
    return (
      tx.subagentId ||
      tx.agentId ||
      tx.targetAgentId ||
      tx.assignedAgentId ||
      payload.subagentId ||
      payload.agentId ||
      payload.targetAgentId ||
      payload.assignedAgentId ||
      null
    );
  }

  /**
   * Evaluates whether an incoming event payload should be delivered to a subscriber
   * based on the currently authenticated agent ID or the subscriber's filter options.
   */
  private matchesSubscriptionFilter(
    event: string,
    payload: any,
    filterOptions?: TransactionSubscriptionOptions
  ): boolean {
    // Only apply transaction routing filters to transaction-related events
    if (
      event !== 'transaction:created' &&
      event !== 'transaction:updated' &&
      event !== 'transaction_alert' &&
      event !== 'notification' &&
      event !== 'notification:created'
    ) {
      return true;
    }

    const payloadAgentId = this.extractAgentId(payload);
    const authAgentId = this.getAuthenticatedAgentId();
    const currentRole = this.getAuthenticatedRole();

    // 1. If an explicit filter was configured on the subscription:
    const targetAgentId = filterOptions?.agentId || (currentRole === 'agent' ? authAgentId : undefined);

    // If the client is an authenticated agent:
    if (currentRole === 'agent' && targetAgentId) {
      if (payloadAgentId) {
        // STRICT FILTER: Only display notifications & updates if payload agentId matches authenticated agent ID
        return payloadAgentId === targetAgentId;
      }

      // If the payload has no agentId (it is an unassigned broadcast):
      // Only allow if allowBroadcasts is true (default true)
      return filterOptions?.allowBroadcasts !== false;
    }

    // If the client is an admin with an explicit agent filter on this subscriber:
    if (filterOptions?.agentId) {
      if (payloadAgentId) {
        return payloadAgentId === filterOptions.agentId;
      }
      return filterOptions.allowBroadcasts !== false;
    }

    // Admins receive all transactions by default
    return true;
  }

  private triggerListeners(event: string, ...args: any[]) {
    if (this.isPaused && event !== 'connect' && event !== 'disconnect') {
      console.log(`[Realtime WebSocket] Paused mode active — ignoring incoming event "${event}"`);
      return;
    }

    const payload = args[0];
    const matchingSubscribers = this.subscribers.filter((s) => s.event === event);

    matchingSubscribers.forEach((sub) => {
      try {
        if (this.matchesSubscriptionFilter(event, payload, sub.filterOptions)) {
          sub.callback(...args);
        }
      } catch (err) {
        console.error(`[Realtime WebSocket] Error executing listener for "${event}":`, err);
      }
    });
  }

  /**
   * Subscription Model for 'transaction:created' events:
   * Front-end filters incoming events and only invokes the callback if the payload's
   * agentId matches the currently authenticated agent's ID (or specified filter).
   */
  public subscribeToTransactionCreated(
    callback: (transaction: any) => void,
    optionsOrAgentId?: string | TransactionSubscriptionOptions
  ): () => void {
    const filterOptions: TransactionSubscriptionOptions =
      typeof optionsOrAgentId === 'string'
        ? { agentId: optionsOrAgentId }
        : optionsOrAgentId || {};

    const handler = (payload: any) => {
      const tx = payload?.transaction || payload?.data?.transaction || payload?.data || payload;
      if (!tx) return;
      callback(tx);
    };

    return this.subscribe('transaction:created', handler, filterOptions);
  }

  /**
   * Event-driven filtered transaction handler:
   * Only triggers the callback if the transaction is assigned specifically to this agentId.
   */
  public onAgentAssignedTransaction(
    agentId: string,
    callback: (transaction: any) => void
  ): () => void {
    const filter: TransactionSubscriptionOptions = {
      agentId,
      allowBroadcasts: false,
    };

    const handler = (payload: any) => {
      const tx = payload?.transaction || payload?.data?.transaction || payload?.data || payload;
      if (!tx) return;
      callback(tx);
    };

    const unsubCreated = this.subscribe('transaction:created', handler, filter);
    const unsubUpdated = this.subscribe('transaction:updated', handler, filter);
    const unsubAlert = this.subscribe('transaction_alert', handler, filter);

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubAlert();
    };
  }

  /**
   * Event-driven filtered notification handler:
   * Ensures agent receives only alerts targeted to their ID or global system broadcasts.
   */
  public onAgentScopedNotification(
    agentId: string,
    callback: (notification: any) => void
  ): () => void {
    const filter: TransactionSubscriptionOptions = {
      agentId,
      allowBroadcasts: true,
    };

    const handler = (notif: any) => {
      if (!notif) return;
      callback(notif);
    };

    const unsub1 = this.subscribe('notification', handler, filter);
    const unsub2 = this.subscribe('notification:created', handler, filter);

    return () => {
      unsub1();
      unsub2();
    };
  }

  public triggerLocalScopedNotification(targetUserId: string, notificationData: any) {
    const activeRole = this.getAuthenticatedRole();
    const currentAgentId = this.getAuthenticatedAgentId();
    const target = notificationData?.targetAgentId || notificationData?.agentId || notificationData?.subagentId;

    if (activeRole === 'agent' && target && currentAgentId && target !== currentAgentId) {
      // Drop notification for non-matching agent to enforce strict isolation
      return;
    }

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
    this.subscribers = [];
  }
}

export const socketService = new RealtimeSocketService();
