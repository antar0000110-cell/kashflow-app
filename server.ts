import express from 'express';
import http from 'http';
import path from 'path';
import { apiRouter } from './server/api';
import { realtime } from './server/ws';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Basic security and parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Mount API routes first
  app.use('/api', apiRouter);

  // Health check endpoint for Docker / Container Orchestration
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Attach real-time WebSocket server
  realtime.initialize(server);

  // Development vs Production Asset Serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[UZX Financial OS] Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
  process.exit(1);
});
