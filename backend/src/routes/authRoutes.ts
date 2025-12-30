import { Router } from 'express';
import prisma from '../lib/prisma';
import { authLimiter } from '../middleware/rateLimiter';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

router.post('/login', authLimiter, async (req, res) => {
  console.log('LOGIN ATTEMPT DEBUG:', req.body);
  const { password } = req.body;
  // KULLANICI ADI YOKSA 'admin' KABUL ET
  const username = req.body.username || 'admin';

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('Invalid password for:', username);
      return res.status(401).json({ success: false, message: 'Hatalı şifre.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

export default router;
