import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Secure credentials
const ADMIN_ID = process.env.ADMIN_ID || '01959524393';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@sara116';

// Server-side active session store (Token -> { createdAt, expiresAt, ip })
interface ActiveSession {
  token: string;
  id: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}
const activeSessions = new Map<string, ActiveSession>();

// Brute-force protection store (IP -> { count, lockedUntil, lastAttempt })
interface RateLimitRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Data persistence directory for custom site edits
const DATA_DIR = path.join(process.cwd(), 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'site-content.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Constant-time comparison helper
function timingSafeCheck(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Middleware: Require Admin Authentication
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
    return;
  }

  // Extend session on activity (sliding expiration up to 24h)
  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  next();
}

/* ==========================================================================
   HEALTH CHECK
   ========================================================================== */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'Signora Bloom CMS API' });
});

/* ==========================================================================
   AUTHENTICATION APIS
   ========================================================================== */

// 1. Admin Login with brute force defense and timing-attack resistance
app.post('/api/auth/login', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const now = Date.now();

  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: 0 };

  // Check if IP is currently locked out
  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    res.status(429).json({
      error: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${remainingSec} seconds.`,
      locked: true,
      remainingSec,
    });
    return;
  }

  const { id, pass } = req.body;

  if (!id || !pass || typeof id !== 'string' || typeof pass !== 'string') {
    res.status(400).json({ error: 'ID and password are required.' });
    return;
  }

  const isIdValid = timingSafeCheck(id.trim(), ADMIN_ID);
  const isPassValid = timingSafeCheck(pass, ADMIN_PASSWORD);

  if (!isIdValid || !isPassValid) {
    record.count += 1;
    record.lastAttempt = now;

    // After 5 failed attempts, lock for 10 minutes
    if (record.count >= 5) {
      record.lockedUntil = now + 10 * 60 * 1000;
      loginAttempts.set(ip, record);
      res.status(429).json({
        error: 'Too many incorrect attempts. For security, access is temporarily locked for 10 minutes.',
        locked: true,
        remainingSec: 600,
      });
      return;
    }

    loginAttempts.set(ip, record);
    const attemptsLeft = 5 - record.count;
    res.status(401).json({
      error: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before temporary security lock.`,
      attemptsLeft,
    });
    return;
  }

  // Successful login -> Clear rate-limiting records
  loginAttempts.delete(ip);

  // Generate cryptographically secure random session token (256-bit)
  const token = crypto.randomBytes(32).toString('hex');
  const session: ActiveSession = {
    token,
    id: ADMIN_ID,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    ip,
  };
  activeSessions.set(token, session);

  res.json({
    success: true,
    token,
    user: {
      id: ADMIN_ID,
      role: 'SUPER_ADMIN',
    },
    message: 'Authentication successful.',
  });
});

// 2. Verify Session Token
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    res.status(401).json({ valid: false, error: 'Session expired or invalid' });
    return;
  }

  res.json({
    valid: true,
    user: {
      id: session.id,
      role: 'SUPER_ADMIN',
    },
  });
});

// 3. Logout (Revoke Token)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* ==========================================================================
   CONTENT MANAGEMENT APIS
   ========================================================================== */

// 4. Get active site content (Public)
app.get('/api/content', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const data = fs.readFileSync(CONTENT_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      res.json({ success: true, content: parsed, source: 'custom' });
      return;
    }
    res.json({ success: true, content: null, source: 'default' });
  } catch (error) {
    console.error('Failed to read content file:', error);
    res.json({ success: true, content: null, source: 'default' });
  }
});

// 5. Save site content (Protected - Admin ONLY)
app.post('/api/content', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      res.status(400).json({ error: 'Valid content object is required.' });
      return;
    }

    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf-8');
    res.json({
      success: true,
      message: 'Site changes published successfully.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to save content:', error);
    res.status(500).json({ error: 'Internal server error while saving changes.' });
  }
});

// 6. Reset site content to defaults (Protected - Admin ONLY)
app.post('/api/content/reset', requireAdminAuth, (req: Request, res: Response) => {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      fs.unlinkSync(CONTENT_FILE);
    }
    res.json({ success: true, message: 'Site restored to factory defaults.' });
  } catch (error) {
    console.error('Failed to reset content:', error);
    res.status(500).json({ error: 'Failed to reset content.' });
  }
});

// 7. Image Upload Handler (Protected - Admin ONLY)
app.post('/api/upload', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'base64Data is required.' });
      return;
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid base64 format.' });
      return;
    }

    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);
    res.json({
      success: true,
      url: `/uploads/${safeName}`,
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to save uploaded image.' });
  }
});

/* ==========================================================================
   VITE DEVELOPMENT & PRODUCTION SERVING
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Signora Bloom Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
