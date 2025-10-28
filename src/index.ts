// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { connectDatabase } from './config/database';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// ----------------- Middleware -----------------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Cloud Run (fixes rate limiting X-Forwarded-For warning)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

// ----------------- Routes -----------------
app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Editor Backend API' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload Too Large',
      message: 'The request entity is too large. Maximum size is 10MB.',
    });
  }
  res.status(err?.status || 500).json({
    error: { message: err?.message || 'Internal server error', status: err?.status || 500 },
  });
});

// ----------------- Start servers -----------------
async function startServer() {
  try {
    console.log('📋 Environment Configuration:');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}`);

    await connectDatabase();

    // Start HTTP server with WebSocket support on the same port
    const httpServer = app.listen(PORT, () => {
      console.log(`🚀 HTTP+WS Server running on port ${PORT}`);
      console.log(`📝 API endpoints available at http://localhost:${PORT}/api/v1`);
      console.log(`🔗 WebSocket server available at ws://localhost:${PORT}`);
    });

    // Attach WebSocket server to the same HTTP server
    const wss = new WebSocketServer({ server: httpServer });

    // Dynamically require the CommonJS module
    const { setupWSConnection } = require('@y/websocket-server/utils');

    wss.on('connection', (ws, req) => {
      try {
        // Use setupWSConnection from @y/websocket-server
        setupWSConnection(ws, req, { gc: true });
        console.log(`📄 Client connected to Yjs collaboration server`);
      } catch (hErr) {
        console.error('Error while handling incoming WS connection:', hErr);
      }
    });
  } catch (error) {
    console.error('✗ Failed to start servers:', error);
    process.exit(1);
  }
}

startServer();

export default app;
