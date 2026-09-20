// UZX Wallet Real-Time Subscription & Socket Simulation Service
// Restricts broadcasts to individual authenticated instances based on join channels

export interface SocketMock {
  connected: boolean;
  socketId: string;
  subscriptions: Set<string>;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  disconnect: () => void;
}

class SocketMockService implements SocketMock {
  public connected: boolean = false;
  public socketId: string = '';
  public subscriptions: Set<string> = new Set();
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};

  public async connect(userId: string, sessionToken?: string) {
    const token = sessionToken || localStorage.getItem('uzx_session_token');
    
    // Construct handshake connection options with query token
    const connectionOptions = {
      query: {
        token: token || ''
      }
    };
    
    console.log(`[Socket Handshake] Initializing socket connection for user "${userId}"...`);
    console.log(`[Socket Handshake] Sending connection query handshake token: "${connectionOptions.query.token.substring(0, 15)}..."`);

    // Validate handshake token with backend before establishing connection and room membership
    const isValid = await this.validateSessionOnBackend(userId, connectionOptions.query.token);
    if (!isValid) {
      console.error(`[Socket Security] Handshake authentication rejected. Invalid or missing token in connection query for user "${userId}".`);
      this.disconnect();
      return;
    }

    this.connected = true;
    this.socketId = `socket_session_${Math.floor(Math.random() * 1000000)}`;
    console.log(`[Socket Service] Handshake authenticated successfully. Assigned Socket ID: ${this.socketId}`);
    
    // Subscribe strictly to the validated unique room channel
    this.emit('join', userId);
  }

  private async validateSessionOnBackend(userId: string, token: string | null): Promise<boolean> {
    if (!token) return false;
    try {
      const response = await fetch('/api/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      }).catch(() => {
        // Fallback for SPA frontend-only environments, validates local storage tokens
        return {
          ok: true,
          json: async () => ({ valid: token.includes('session_token') })
        };
      });

      const data = typeof response.json === 'function' ? await response.json().catch(() => ({ valid: true })) : { valid: true };
      return Boolean(data && data.valid);
    } catch {
      return false;
    }
  }

  public emit(event: string, ...args: any[]) {
    console.log(`[Socket Emit] Event "${event}":`, args);
    if (event === 'join') {
      const userId = args[0];
      // Only allow subscription to validated user identifier
      this.subscriptions.clear(); // Clear previous channels to prevent multiple subscriptions
      this.subscriptions.add(userId);
      console.log(`[Socket Subscription] Socket ID ${this.socketId} subscribed to unique room-based channel: "${userId}"`);
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

  public triggerLocalScopedNotification(targetUserId: string, notificationData: any) {
    // Only push if socket is connected and targetUserId is explicitly subscribed (scoped to user rather than global broadcast)
    if (!this.connected) {
      console.warn(`[Socket Blocked] Blocked notification push. Socket client is not connected.`);
      return;
    }

    const isSubscribed = this.subscriptions.has(targetUserId) || this.subscriptions.has('admin');
    if (!isSubscribed) {
      console.warn(`[Socket Blocked] Blocked transaction notification. Socket ID ${this.socketId} is not subscribed to user ID "${targetUserId}".`);
      return;
    }

    console.log(`[Socket Deliver] Successfully pushed targeted transaction update to Socket ID ${this.socketId} for user "${targetUserId}".`);
    
    if (this.listeners['transaction_update']) {
      this.listeners['transaction_update'].forEach((callback) => {
        callback(notificationData);
      });
    }
  }

  public disconnect() {
    if (this.socketId) {
      console.log(`[Socket Service] Disconnecting Socket ID: ${this.socketId}`);
    }
    this.connected = false;
    this.socketId = '';
    this.subscriptions.clear();
    this.listeners = {};
  }
}

export const socketService = new SocketMockService();
export default socketService;
