import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import helmet from 'helmet';
import { db, initDb } from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Render proxy & cookies
app.set('trust proxy', 1);

// Helmet with custom CSP for Telegram widget
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://telegram.org"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://telegram.org"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'dxsess',
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

// static
app.use(express.static(path.join(__dirname, 'public')));

// util
function verifyTelegramAuth(payload) {
  const { hash, ...rest } = payload;
  const dataCheckString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();
  const calc = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  const isFresh = Math.floor(Date.now()/1000) - Number(rest.auth_date) < 86400;
  return calc === hash && isFresh;
}

function requireAuth(req, _res, next) {
  if (req.session?.user) return next();
  return next({ status: 401, message: 'Unauthorized' });
}

// routes
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/telegram', (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.id || !data.hash || !data.auth_date) {
      return next({ status: 400, message: 'Invalid payload' });
    }
    if (!verifyTelegramAuth(data)) {
      return next({ status: 401, message: 'Verification failed' });
    }
    
    req.session.user = {
      id: String(data.id),
      name: [data.first_name, data.last_name].filter(Boolean).join(' '),
      username: data.username || null,
      photo_url: data.photo_url || null
    };
    
    res.json({ ok: true, user: req.session.user });
  } catch (e) {
    next(e);
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('dxsess');
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session?.user || null });
});

app.get('/api/quotes', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM quotes ORDER BY createdAt DESC').all();
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

app.post('/api/quotes', requireAuth, (req, res, next) => {
  try {
    const { text, author } = req.body;
    if (!text || typeof text !== 'string') {
      return next({ status: 400, message: 'Text required' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO quotes (id, text, author, userId, username, createdAt) 
      VALUES (@id, @text, @author, @userId, @username, @createdAt)
    `);
    
    const quote = {
      id: crypto.randomUUID(),
      text: text.trim(),
      author: (author || '').trim(),
      userId: req.session.user.id,
      username: req.session.user.username || req.session.user.name || 'user',
      createdAt: new Date().toISOString()
    };
    
    stmt.run(quote);
    res.status(201).json(quote);
  } catch (e) {
    next(e);
  }
});

app.delete('/api/quotes/:id', requireAuth, (req, res, next) => {
  try {
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!q) {
      return next({ status: 404, message: 'Not found' });
    }
    if (q.userId !== req.session.user.id) {
      return next({ status: 403, message: 'Forbidden' });
    }
    
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// optional webhook stub
app.post('/webhook', (req, res) => {
  const secret = req.headers['x-telegram-bot-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).end();
  }
  res.json({ ok: true });
});

// fallback
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve CV page from project root so live edits reflect in dev
app.get('/cv', (_req, res) => {
  res.sendFile(path.join(__dirname, 'cv.html'));
});

// error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

await initDb();
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`)); 