import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All config routes require admin except GET (read-only for all authenticated users)

// ===== DEPARTMENTS =====

router.get('/departments', authenticate, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    console.error('List departments error:', error);
    res.status(500).json({ error: 'Departmanlar listelenemedi.' });
  }
});

router.post('/departments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Departman adı gerekli.' });
    }
    
    const department = await prisma.department.create({
      data: { name, code }
    });
    
    res.status(201).json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu departman zaten mevcut.' });
    }
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Departman oluşturulamadı.' });
  }
});

router.put('/departments/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, active } = req.body;
    
    const department = await prisma.department.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(active !== undefined && { active })
      }
    });
    
    res.json(department);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Departman bulunamadı.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu departman adı veya kodu zaten kullanılıyor.' });
    }
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Departman güncellenemedi.' });
  }
});

router.delete('/departments/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete: mark as inactive
    await prisma.department.update({
      where: { id },
      data: { active: false }
    });
    
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Departman bulunamadı.' });
    }
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Departman silinemedi.' });
  }
});

// ===== RESOURCES =====

router.get('/resources', authenticate, async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(resources);
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ error: 'Kaynaklar listelenemedi.' });
  }
});

router.post('/resources', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, type, exclusive } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Kaynak adı ve tipi gerekli.' });
    }
    
    if (!['equipment', 'consumable'].includes(type)) {
      return res.status(400).json({ error: 'Geçersiz kaynak tipi.' });
    }
    
    const resource = await prisma.resource.create({
      data: { 
        name, 
        type, 
        exclusive: exclusive || false 
      }
    });
    
    res.status(201).json(resource);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu kaynak zaten mevcut.' });
    }
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Kaynak oluşturulamadı.' });
  }
});

router.put('/resources/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, exclusive, active } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (type && ['equipment', 'consumable'].includes(type)) updateData.type = type;
    if (exclusive !== undefined) updateData.exclusive = exclusive;
    if (active !== undefined) updateData.active = active;
    
    const resource = await prisma.resource.update({
      where: { id },
      data: updateData
    });
    
    res.json(resource);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Kaynak bulunamadı.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu kaynak adı zaten kullanılıyor.' });
    }
    console.error('Update resource error:', error);
    res.status(500).json({ error: 'Kaynak güncellenemedi.' });
  }
});

router.delete('/resources/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await prisma.resource.update({
      where: { id },
      data: { active: false }
    });
    
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Kaynak bulunamadı.' });
    }
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Kaynak silinemedi.' });
  }
});

// ===== LOCATIONS =====

router.get('/locations', authenticate, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('List locations error:', error);
    res.status(500).json({ error: 'Mekanlar listelenemedi.' });
  }
});

router.post('/locations', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, capacity } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Mekan adı gerekli.' });
    }
    
    const location = await prisma.location.create({
      data: { 
        name, 
        capacity: capacity ? parseInt(capacity) : null 
      }
    });
    
    res.status(201).json(location);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu mekan zaten mevcut.' });
    }
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Mekan oluşturulamadı.' });
  }
});

router.put('/locations/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, active } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null;
    if (active !== undefined) updateData.active = active;
    
    const location = await prisma.location.update({
      where: { id },
      data: updateData
    });
    
    res.json(location);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mekan bulunamadı.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu mekan adı zaten kullanılıyor.' });
    }
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Mekan güncellenemedi.' });
  }
});

router.delete('/locations/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await prisma.location.update({
      where: { id },
      data: { active: false }
    });
    
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mekan bulunamadı.' });
    }
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Mekan silinemedi.' });
  }
});

export default router;
