import { Router } from 'express';
import prisma from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
// const prisma = new PrismaClient(); // Removed
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Login Endpoint
router.post('/login', async (req, res) => {
  const { password } = req.body; // In this simple app, we only check password for admin

  // Real implementation would check username too. 
  // For compatibility with the frontend mock, we look for the 'admin' user if password matches 'admin123' logic, 
  // OR we implement standard auth.

  // Let's implement standard username/password auth but default username to 'admin' if not provided
  const username = req.body.username || 'admin';

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
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
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

export default router;