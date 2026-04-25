import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload.js';
import answerRouter from './routes/answer.js';

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT ?? 3001);

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  // CSP is omitted here; set it at your reverse-proxy or configure per-app
  contentSecurityPolicy: false,
}));

// ── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── Compression ─────────────────────────────────────────────────────────────
// Skip SSE streams — they need to flush tokens immediately
app.use(compression({
  filter: (req, res) => {
    if (res.getHeader('Content-Type') === 'text/event-stream') return false;
    return compression.filter(req, res);
  },
}));

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
app.use(cors({
  origin: isProd ? allowedOrigin : true,
  methods: ['GET', 'POST'],
}));

// ── Body parsing ────────────────────────────────────────────────────────────
// 50 KB is more than enough for question + truncated context fields
app.use('/api/answer', express.json({ limit: '50kb' }));
app.use('/api/upload', express.json({ limit: '50kb' }));

// ── Rate limiting ───────────────────────────────────────────────────────────
const answerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // 40 questions per 15 min — more than enough for any interview
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait a moment.' },
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/upload', uploadLimiter, uploadRouter);
app.use('/api/answer', answerLimiter, answerRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: 'claude-sonnet-4-6', env: isProd ? 'production' : 'development' });
});

// ── Catch unknown /api/* routes before static handler ───────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ── Static client (production only) ─────────────────────────────────────────
if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist, { maxAge: '1y', etag: true }));
  // SPA fallback for all non-API routes (React Router support)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Graceful shutdown ────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set — copy .env.example to server/.env');
  }
});

function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force exit if connections don't close within 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
