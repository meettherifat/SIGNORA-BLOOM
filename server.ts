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

// Secure credentials & JWT Secret
const ADMIN_ID = process.env.ADMIN_ID || '01959524393';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@sara116';
const JWT_SECRET = process.env.JWT_SECRET || 'signora_bloom_atelier_secure_jwt_secret_2026_x89';

// JWT Helper: Base64URL encoding/decoding
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

// Generate HS256 JWT Token
interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  ip?: string;
}

function createJwtToken(id: string, role = 'SUPER_ADMIN', ip = ''): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: id,
    role,
    iat: now,
    exp: now + 24 * 60 * 60, // 24-hour expiration
    jti: crypto.randomBytes(16).toString('hex'),
    iss: 'signora-bloom-atelier',
    ip,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify HS256 JWT Token with anti-tamper signature check
function verifyJwtToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing token' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT structure' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time signature comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false, error: 'Invalid token signature. Tampering detected.' };
  }

  try {
    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now >= payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }

    if (payload.sub !== ADMIN_ID) {
      return { valid: false, error: 'Invalid token subject' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

// Revoked tokens blacklist (in-memory, keyed by jti or token)
const revokedTokens = new Set<string>();

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
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

// Helper for deep merging hero slides on the server
function mergeHeroSlidesServer(baseSlides: any[], incomingSlides?: any[]) {
  if (!Array.isArray(incomingSlides) || incomingSlides.length === 0) {
    return Array.isArray(baseSlides) ? baseSlides : [];
  }
  const slideMap = new Map<number, any>();
  if (Array.isArray(baseSlides)) {
    baseSlides.forEach((s, idx) => {
      const id = typeof s.id === 'number' ? s.id : idx;
      slideMap.set(id, { ...s });
    });
  }
  incomingSlides.forEach((inc, idx) => {
    if (!inc || typeof inc !== 'object') return;
    const slideId = typeof inc.id === 'number' ? inc.id : idx;
    const existing = slideMap.get(slideId) || (Array.isArray(baseSlides) ? baseSlides[idx] : null) || {
      id: slideId,
      image: '',
      alt: '',
      headline: '',
      buttonText: 'SHOP NOW',
    };
    slideMap.set(slideId, {
      ...existing,
      id: slideId,
      image: typeof inc.image === 'string' && inc.image.trim() !== '' ? inc.image : existing.image,
      alt: typeof inc.alt === 'string' ? inc.alt : existing.alt,
      headline: typeof inc.headline === 'string' ? inc.headline : existing.headline,
      buttonText: typeof inc.buttonText === 'string' ? inc.buttonText : existing.buttonText,
    });
  });

  return Array.from(slideMap.values());
}

// Deep merges collection cards preserving all 5 default cards
function mergeCollectionsServer(existingCollections?: any[], incomingCollections?: any[]) {
  const defaultCollections = [
    {
      id: 'fine-rings',
      title: 'FINE RINGS',
      subtitle: 'Architectural bands & diamond pavé silhouettes',
      category: 'rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
      itemCount: '24 Designs',
      span: 'tall',
    },
    {
      id: 'sculptural-bracelets',
      title: 'SCULPTURAL BRACELETS',
      subtitle: 'Torques, curb links & everyday wrist cuffs',
      category: 'bracelets',
      image: 'https://images.unsplash.com/photo-1611591475879-f191b702ec49?auto=format&fit=crop&w=800&q=85',
      itemCount: '18 Designs',
      span: 'square',
    },
    {
      id: 'drop-hoop-earrings',
      title: 'DROP & HOOP EARRINGS',
      subtitle: 'Light-catching chandeliers & modern huggies',
      category: 'earrings',
      image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85',
      itemCount: '32 Designs',
      span: 'square',
    },
    {
      id: 'medallion-necklaces',
      title: 'MEDALLION NECKLACES',
      subtitle: 'Layering chains & coin pendants',
      category: 'necklaces',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
      itemCount: '16 Designs',
      span: 'wide',
    },
    {
      id: 'shop-charms',
      title: 'SHOP CHARMS',
      subtitle: 'Sculpted charms & everyday statement pendants',
      category: 'charms',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
      itemCount: '20 Designs',
      span: 'tall',
    },
  ];

  const colMap = new Map<string, any>();
  defaultCollections.forEach((c) => colMap.set(c.id, { ...c }));

  if (Array.isArray(existingCollections)) {
    existingCollections.forEach((c) => {
      if (c && c.id) {
        colMap.set(c.id, { ...(colMap.get(c.id) || {}), ...c });
      }
    });
  }

  if (Array.isArray(incomingCollections)) {
    incomingCollections.forEach((c) => {
      if (c && c.id) {
        colMap.set(c.id, { ...(colMap.get(c.id) || {}), ...c });
      }
    });
  }

  return Array.from(colMap.values());
}

// Constant-time comparison helper
function timingSafeCheck(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Middleware: Require Admin Authentication (Supports JWT and active session tokens)
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    return;
  }

  const token = authHeader.substring(7).trim();

  // Check if token was explicitly revoked
  if (revokedTokens.has(token)) {
    res.status(401).json({ error: 'Unauthorized: Session token has been revoked.' });
    return;
  }

  // 1. Try JWT verification first
  if (token.includes('.')) {
    const jwtResult = verifyJwtToken(token);
    if (jwtResult.valid && jwtResult.payload) {
      if (jwtResult.payload.jti && revokedTokens.has(jwtResult.payload.jti)) {
        res.status(401).json({ error: 'Unauthorized: JWT token has been revoked.' });
        return;
      }
      return next();
    }
  }

  // 2. Fallback to active sessions store (for legacy or direct tokens)
  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired, invalid, or tampered.' });
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

  // Generate cryptographically secure JWT token with HS256 and JTI nonce
  const jwtToken = createJwtToken(ADMIN_ID, 'SUPER_ADMIN', ip);

  // Also register active session for backward compatibility
  const session: ActiveSession = {
    token: jwtToken,
    id: ADMIN_ID,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    ip,
  };
  activeSessions.set(jwtToken, session);

  res.json({
    success: true,
    token: jwtToken,
    user: {
      id: ADMIN_ID,
      role: 'SUPER_ADMIN',
    },
    message: 'Authentication successful.',
  });
});

// 2. Verify Session Token (JWT + Session Store anti-tamper check)
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7).trim();

  // Check if token was revoked
  if (revokedTokens.has(token)) {
    res.status(401).json({ valid: false, error: 'Token has been revoked' });
    return;
  }

  // 1. Check if token is a signed JWT
  if (token.includes('.')) {
    const jwtResult = verifyJwtToken(token);
    if (!jwtResult.valid || !jwtResult.payload) {
      res.status(401).json({ valid: false, error: jwtResult.error || 'Invalid or tampered JWT token' });
      return;
    }

    if (jwtResult.payload.jti && revokedTokens.has(jwtResult.payload.jti)) {
      res.status(401).json({ valid: false, error: 'JWT token has been revoked' });
      return;
    }

    res.json({
      valid: true,
      user: {
        id: jwtResult.payload.sub,
        role: jwtResult.payload.role || 'SUPER_ADMIN',
      },
    });
    return;
  }

  // 2. Fallback to active sessions store
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

// 3. Logout (Revoke Token and Blacklist JTI)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    revokedTokens.add(token);
    activeSessions.delete(token);

    if (token.includes('.')) {
      const decoded = verifyJwtToken(token);
      if (decoded.payload && decoded.payload.jti) {
        revokedTokens.add(decoded.payload.jti);
      }
    }
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

    // Read existing content if present to merge
    let existingContent: any = {};
    if (fs.existsSync(CONTENT_FILE)) {
      try {
        existingContent = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
      } catch (err) {
        console.warn('Could not parse existing content file, starting fresh merge:', err);
      }
    }

    // Deep merge to ensure updating one or two hero slides never overwrites the rest
    const mergedContent = {
      ...existingContent,
      ...content,
      brand: { ...(existingContent.brand || {}), ...(content.brand || {}) },
      hero: {
        ...(existingContent.hero || {}),
        ...(content.hero || {}),
        slides: mergeHeroSlidesServer(existingContent.hero?.slides, content.hero?.slides),
      },
      collections: mergeCollectionsServer(existingContent.collections, content.collections),
      editorial: {
        ...(existingContent.editorial || {}),
        ...(content.editorial || {}),
        tabs: Array.isArray(content.editorial?.tabs) && content.editorial.tabs.length > 0
          ? content.editorial.tabs
          : (existingContent.editorial?.tabs || []),
      },
      giftSection: {
        ...(existingContent.giftSection || {}),
        ...(content.giftSection || {}),
      },
      products: Array.isArray(content.products) && content.products.length > 0
        ? content.products
        : (existingContent.products || []),
      footer: { ...(existingContent.footer || {}), ...(content.footer || {}) },
    };

    fs.writeFileSync(CONTENT_FILE, JSON.stringify(mergedContent, null, 2), 'utf-8');
    res.json({
      success: true,
      message: 'Site changes merged and published successfully.',
      content: mergedContent,
      verifiedSlides: mergedContent.hero?.slides?.map((s: any) => ({
        id: s.id,
        image: s.image,
        alt: s.alt,
        headline: s.headline,
      })),
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
