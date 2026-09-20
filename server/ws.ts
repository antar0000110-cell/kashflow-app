import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyAuthToken, AuthTokenPayload } from './auth';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  user?: AuthTokenPayload;
  rooms: Set<string>;
}

export class RealtimeService {
  private wss: WebSocketServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public initialize(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      ws.isAlive = true;
      ws.rooms = new Set(['global']);

      // Parse token from query parameter or authorization header
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token') || (req.headers['sec-websocket-protocol'] as string);

      if (token) {
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
        const payload = verifyAuthToken(cleanToken);
        if (payload) {
          ws.user = payload;
          if (payload.role === 'admin') {
            ws.rooms.add('admin');
            ws.rooms.add('role:admin');
          } else if (payload.role === 'agent') {
            ws.rooms.add('agents');
            ws.rooms.add('role:agent');
            if (payload.agentId) {
              ws.rooms.add(`agent:${payload.agentId}`);
              ws.rooms.add(payload.agentId);
            }
          }
          console.log(`[WebSocket] Client connected: user=${payload.username}, role=${payload.role}, rooms=[${Array.from(ws.rooms).join(', ')}]`);
        }
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: string) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'join' && parsed.room) {
            // Only allow subscription if user has permission
            if (parsed.room === 'admin' && ws.user?.role !== 'admin') {
              return;
            }
            ws.rooms.add(parsed.room);
            console.log(`[WebSocket] Client joined room: ${parsed.room}`);
          }
        } catch {
          // ignore non-JSON messages
        }
      });

      ws.on('close', () => {
        // Disconnected
      });

      // Send immediate connection established ack
      ws.send(JSON.stringify({
        type: 'connected',
        authenticated: Boolean(ws.user),
        user: ws.user ? { username: ws.user.username, role: ws.user.role } : null,
        timestamp: new Date().toISOString()
      }));
    });

    // Heartbeat to prune dead connections
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const extWs = client as ExtendedWebSocket;
        if (!extWs.isAlive) {
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  public broadcast(event: string, payload: any, targetRoom?: string) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: event,
      data: payload,
      timestamp: new Date().toISOString()
    });

    this.wss.clients.forEach((client) => {
      const extWs = client as ExtendedWebSocket;
      if (extWs.readyState === WebSocket.OPEN) {
        if (!targetRoom || extWs.rooms.has(targetRoom) || targetRoom === 'all') {
          extWs.send(message);
        }
      }
    });
  }

  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const realtime = new RealtimeService();
