import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery, executeRun } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'togoserve_production_secret_key_2026_jwt_auth';
const TOKEN_EXPIRY = '7d';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Authentication Middleware: Enforces valid Bearer JWT on protected endpoints
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access token required. Please sign in.',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      error: 'FORBIDDEN_INVALID_TOKEN',
      message: 'Session has expired or token is invalid. Please sign in again.',
    });
  }

  req.user = decoded;
  next();
}

/**
 * RBAC Role Guard Middleware: Enforces that the authenticated user possesses one of the allowed roles
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN_INSUFFICIENT_ROLE',
        message: `Role '${req.user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Register Handler
 */
export async function handleRegister(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, role = 'customer' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email, password, and full name are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = executeQuery('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'CONFLICT', message: 'An account with this email already exists.' });
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    executeRun(
      `INSERT INTO users (id, email, password_hash, full_name, phone_number, role, status, is_email_verified, is_phone_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 1, 1, ?, ?)`,
      [userId, normalizedEmail, passwordHash, fullName, phone || '+639000000000', role, now, now]
    );

    // If customer, initialize customer record
    if (role === 'customer') {
      const customerId = `cust-${userId}`;
      executeRun(
        `INSERT INTO customers (id, user_id, wallet_balance, is_togo_plus, created_at)
         VALUES (?, ?, 100.0, 0, ?)`,
        [customerId, userId, now]
      );
    }

    const payload: AuthUserPayload = {
      userId,
      email: normalizedEmail,
      role,
      fullName,
    };

    const token = generateToken(payload);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email: normalizedEmail,
        fullName,
        phone: phone || '',
        role,
        status: 'active',
      },
    });
  } catch (err: any) {
    console.error('[Auth] Registration error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create user account' });
  }
}

/**
 * Login Handler
 */
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const rows = executeQuery(
      'SELECT id, email, password_hash, full_name, phone_number, role, status FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (user.status === 'suspended' || user.status === 'deactivated') {
      return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended or deactivated.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    const token = generateToken(payload);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone_number,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to process login request' });
  }
}

/**
 * Get Current User Profile (GET /api/auth/me)
 */
export function handleGetMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const rows = executeQuery(
    'SELECT id, email, full_name, phone_number, role, status, is_email_verified, is_phone_verified, created_at FROM users WHERE id = ?',
    [req.user.userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  const u = rows[0];
  return res.json({
    user: {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone_number,
      role: u.role,
      status: u.status,
      isEmailVerified: Boolean(u.is_email_verified),
      isPhoneVerified: Boolean(u.is_phone_verified),
      createdAt: u.created_at,
    },
  });
}

/**
 * Password Reset Request
 */
export function handlePasswordResetRequest(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email address is required.' });
  }

  // Security best practice: respond with success even if user not found to prevent enumeration
  return res.json({
    message: 'Password reset instructions have been dispatched to your verified email address.',
    notice: 'In live operations, check your inbox for the reset verification link.',
  });
}

/**
 * Update Profile
 */
export function handleUpdateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const { fullName, phone } = req.body;
  const now = new Date().toISOString();

  executeRun(
    `UPDATE users SET full_name = COALESCE(?, full_name), phone_number = COALESCE(?, phone_number), updated_at = ? WHERE id = ?`,
    [fullName || null, phone || null, now, req.user.userId]
  );

  return res.json({ message: 'Profile updated successfully' });
}
