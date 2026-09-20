import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function sessionCheckPlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    const urlPath = (req.url || '').split('?')[0].replace(/\/+$/, '');
    if (urlPath === '/api/session-check' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace('Bearer ', '').trim();
          const parsed = body ? JSON.parse(body) : {};

          // Check token validity: valid tokens must contain 'session_token' or 'admin_' or 'agent_'
          const isValid = Boolean(
            token &&
              !token.includes('invalid') &&
              !token.includes('expired') &&
              (token.includes('session_token') || token.startsWith('admin_') || token.startsWith('agent_'))
          );

          if (isValid) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                authenticated: true,
                role: parsed.authRole || 'admin',
                token,
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                authenticated: false,
                rejected: true,
                error: 'Unauthorized: Session token rejected by server.',
              })
            );
          }
        } catch (err) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ authenticated: false, rejected: true, error: 'Malformed request payload.' }));
        }
      });
      return;
    }
    next();
  };

  return {
    name: 'session-check-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sessionCheckPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
