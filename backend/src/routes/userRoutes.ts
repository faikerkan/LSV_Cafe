import { Router } from 'express';
import prisma from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All user management routes require admin
router.use(authenticate, requireAdmin);

// List all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Kullanıcılar listelenemedi.' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı.' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    }
    
    if (role && !['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol.' });
    }
    
    // Check if username exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'USER',
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    const updateData: any = {};
    
    if (username) {
      // Check if new username is taken by another user
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
      }
      updateData.username = username;
    }
    
    if (role && ['ADMIN', 'USER'].includes(role)) {
      updateData.role = role;
    }
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        updatedAt: true,
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Kullanıcı güncellenemedi.' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    
    // Prevent self-deletion
    if (authReq.user?.userId === id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });
    }
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Kullanıcı silinemedi.' });
  }
});

// Reset password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    }
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
    
    res.json({ message: 'Şifre başarıyla sıfırlandı.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Şifre sıfırlanamadı.' });
  }
});

export default router;
