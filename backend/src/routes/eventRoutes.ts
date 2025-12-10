import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();
// const prisma = new PrismaClient(); // Removed

const EXCLUSIVE_RESOURCES = ['Projeksiyon', 'Ses Sistemi'];

// Get All Events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' }
    });
    // Frontend expects "startDate" (string) but Prisma returns Date object.
    // Express res.json() handles Date to ISO String conversion automatically.
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Etkinlikler getirilemedi.' });
  }
});

// Create Event
router.post('/', async (req, res) => {
  const data = req.body;

  // 1. Conflict Check
  const newStart = new Date(data.startDate);
  const newEnd = new Date(data.endDate);

  const potentialConflicts = await prisma.event.findMany({
    where: {
      status: { not: 'REJECTED' }, // Ignore rejected events
      AND: [
        { startDate: { lt: newEnd } },
        { endDate: { gt: newStart } }
      ]
    }
  });

  let conflictReason = null;

  for (const existing of potentialConflicts) {
    // Location Check
    if (existing.location === data.location) {
      conflictReason = `Mekan dolu: ${data.location}`;
      break;
    }

    // Resource Check
    if (data.resources && existing.resources) {
      const sharedExclusive = data.resources.filter((r: string) =>
        existing.resources.includes(r) && EXCLUSIVE_RESOURCES.includes(r)
      );
      if (sharedExclusive.length > 0) {
        conflictReason = `Ekipman kullanımda: ${sharedExclusive.join(', ')}`;
        break;
      }
    }
  }

  if (conflictReason) {
    return res.status(409).json({ message: conflictReason, conflict: true });
  }

  // 2. Create
  try {
    // Remove ID if passed (let DB generate UUID)
    const { id, ...createData } = data;

    const event = await prisma.event.create({
      data: {
        ...createData,
        startDate: newStart,
        endDate: newEnd
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Etkinlik oluşturulamadı.' });
  }
});

// Update Event
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Conflict Check (Excluding self)
  const newStart = new Date(data.startDate);
  const newEnd = new Date(data.endDate);

  const potentialConflicts = await prisma.event.findMany({
    where: {
      id: { not: id },
      status: { not: 'REJECTED' },
      AND: [
        { startDate: { lt: newEnd } },
        { endDate: { gt: newStart } }
      ]
    }
  });

  // Reuse conflict logic (simplified here)
  for (const existing of potentialConflicts) {
    if (existing.location === data.location) {
      return res.status(409).json({ message: `Mekan dolu: ${data.location}` });
    }
    const sharedExclusive = data.resources.filter((r: string) =>
      existing.resources.includes(r) && EXCLUSIVE_RESOURCES.includes(r)
    );
    if (sharedExclusive.length > 0) {
      return res.status(409).json({ message: `Ekipman kullanımda: ${sharedExclusive.join(', ')}` });
    }
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        department: data.department,
        description: data.description,
        startDate: newStart,
        endDate: newEnd,
        status: data.status,
        contactPerson: data.contactPerson,
        location: data.location,
        resources: data.resources,
        requirements: data.requirements,
        actualAttendees: data.actualAttendees,
        outcomeNotes: data.outcomeNotes
      }
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// Delete Event
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Silme işlemi başarısız.' });
  }
});

export default router;