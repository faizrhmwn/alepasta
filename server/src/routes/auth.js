import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// ── POST /login ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username dan password harus diisi',
      });
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Username atau password salah',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Username atau password salah',
      });
    }

    // Generate JWT
    const payload = { id: user.id, username: user.username, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      data: {
        token,
        user: payload,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── GET /me ─────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const { id, username, name } = req.user;
  return res.json({
    success: true,
    data: { id, username, name },
  });
});

export default router;
