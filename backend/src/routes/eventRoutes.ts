import { Router } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: Create event log
async function createEventLog(
  eventId: string,
  action: string,
  actorId: string | null,
  payload?: any,
  tx?: any // Transaction client (Prisma transaction)
) {
  const prismaClient = tx || prisma;
  await prismaClient.eventLog.create({
    data: {
      eventId,
      action,
      actorId,
      payload: payload ? JSON.stringify(payload) : null,
    }
  });
}

// Helper: Check resource conflicts
async function checkResourceConflicts(
  resourceIds: string[],
  startDate: Date,
  endDate: Date,
  excludeEventId?: string,
  tx?: any // Transaction client (Prisma transaction)
) {
  const prismaClient = tx || prisma;
  if (!resourceIds.length) return [];

  // Get exclusive resources
  const exclusiveResources = await prismaClient.resource.findMany({
    where: {
      id: { in: resourceIds },
      exclusive: true
    }
  });

  if (!exclusiveResources.length) return [];

  // Find overlapping events with these exclusive resources
  const conflicts = await prisma.event.findMany({
    where: {
      id: excludeEventId ? { not: excludeEventId } : undefined,
      status: { not: 'REJECTED' },
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } }
      ],
      eventResources: {
        some: {
          resourceId: { in: exclusiveResources.map(r => r.id) }
        }
      }
    },
    include: {
      eventResources: {
        include: { resource: true }
      }
    }
  });

  return conflicts.map(event => ({
    event,
    conflictingResources: event.eventResources
      .filter(er => exclusiveResources.some(r => r.id === er.resourceId))
      .map(er => er.resource.name)
  }));
}

// Helper: Check location conflicts
async function checkLocationConflicts(
  locationId: string | null,
  startDate: Date,
  endDate: Date,
  excludeEventId?: string,
  tx?: any // Transaction client (Prisma transaction)
) {
  if (!locationId) return [];

  const prismaClient = tx || prisma;
  const conflicts = await prismaClient.event.findMany({
    where: {
      id: excludeEventId ? { not: excludeEventId } : undefined,
      locationId,
      status: { not: 'REJECTED' },
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } }
      ]
    },
    include: {
      location: true
    }
  });

  return conflicts;
}

// GET /api/events - List all events (optional auth for filtering)
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    // Status filter (if authenticated and admin, show all; otherwise show only approved/pending)
    if (req.user?.role === 'ADMIN') {
      if (req.query.status) {
        where.status = req.query.status;
      }
    } else {
      where.status = { in: ['APPROVED', 'COMPLETED'] };
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      where.AND = [];
      if (req.query.startDate) {
        where.AND.push({ startDate: { gte: new Date(req.query.startDate as string) } });
      }
      if (req.query.endDate) {
        where.AND.push({ endDate: { lte: new Date(req.query.endDate as string) } });
      }
    }

    // Get events with pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          location: true,
          eventResources: {
            include: { resource: true }
          },
          createdBy: {
            select: { id: true, username: true }
          },
          updatedBy: {
            select: { id: true, username: true }
          }
        },
        orderBy: { startDate: 'asc' }
      }),
      prisma.event.count({ where })
    ]);

    // Transform for frontend compatibility
    const transformed = events.map(event => ({
      id: event.id,
      title: event.title,
      department: event.department?.name || '',
      departmentId: event.departmentId,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      status: event.status,
      location: event.location?.name || '',
      locationId: event.locationId,
      attendees: event.attendees,
      contactPerson: event.contactPerson,
      requirements: event.requirements,
      resources: event.eventResources.map(er => er.resource.name),
      resourceIds: event.eventResources.map(er => er.resourceId),
      actualAttendees: event.actualAttendees,
      outcomeNotes: event.outcomeNotes,
      createdBy: event.createdBy,
      updatedBy: event.updatedBy,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    }));

    // Return paginated response
    res.json({
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    logger.error('List events error:', { error, stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({ error: 'Etkinlikler getirilemedi.' });
  }
});

// POST /api/events - Create event (authenticated users)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      departmentId,
      description,
      startDate: startDateStr,
      endDate: endDateStr,
      locationId,
      attendees,
      contactPerson,
      requirements,
      resourceIds
    } = req.body;

    if (!title || !startDateStr || !endDateStr) {
      return res.status(400).json({ error: 'Başlık, başlangıç ve bitiş tarihi gerekli.' });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Bitiş tarihi başlangıç tarihinden sonra olmalı.' });
    }

    // Use transaction with Serializable isolation to prevent race conditions
    const event = await prisma.$transaction(async (tx) => {
      // Check conflicts within transaction (prevents race conditions)
      const locationConflicts = await checkLocationConflicts(locationId, startDate, endDate, undefined, tx);
      const resourceConflicts = resourceIds?.length 
        ? await checkResourceConflicts(resourceIds, startDate, endDate, undefined, tx)
        : [];

      if (locationConflicts.length > 0) {
        throw {
          status: 409,
          message: `Mekan dolu: ${locationConflicts[0].location?.name}`,
          conflict: true,
          conflicts: locationConflicts.map(c => ({
            id: c.id,
            title: c.title,
            startDate: c.startDate,
            endDate: c.endDate
          }))
        };
      }

      if (resourceConflicts.length > 0) {
        const resourceNames = resourceConflicts[0].conflictingResources.join(', ');
        throw {
          status: 409,
          message: `Ekipman kullanımda: ${resourceNames}`,
          conflict: true,
          conflicts: resourceConflicts.map(c => ({
            id: c.event.id,
            title: c.event.title,
            resources: c.conflictingResources
          }))
        };
      }

      // Create event within transaction
      const newEvent = await tx.event.create({
        data: {
          title,
          departmentId: departmentId || null,
          description: description || '',
          startDate,
          endDate,
          status: 'PENDING', // User-created events start as pending
          locationId: locationId || null,
          attendees: parseInt(attendees) || 0,
          contactPerson: contactPerson || '',
          requirements: requirements || null,
          createdById: req.user?.userId || null,
          eventResources: resourceIds?.length ? {
            create: resourceIds.map((rid: string) => ({
              resourceId: rid,
              quantity: 1
            }))
          } : undefined
        },
        include: {
          department: true,
          location: true,
          eventResources: {
            include: { resource: true }
          }
        }
      });

      // Log creation within transaction
      await createEventLog(newEvent.id, 'create', req.user?.userId || null, {
        title: newEvent.title,
        department: newEvent.department?.name,
        location: newEvent.location?.name,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate
      }, tx);

      return newEvent;
    }, {
      isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
      timeout: 10000 // 10 second timeout
    });

    res.status(201).json(event);
  } catch (error: any) {
    // Handle transaction errors (conflicts)
    if (error.status === 409) {
      return res.status(409).json({
        message: error.message,
        conflict: error.conflict,
        conflicts: error.conflicts
      });
    }
    logger.error('Create event error:', { error, stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({ error: 'Etkinlik oluşturulamadı.' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      departmentId,
      description,
      startDate: startDateStr,
      endDate: endDateStr,
      status,
      locationId,
      attendees,
      contactPerson,
      requirements,
      resourceIds,
      actualAttendees,
      outcomeNotes
    } = req.body;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı.' });
    }

    // Authorization: only admin can change status or edit other's events
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && existingEvent.createdById !== req.user?.userId) {
      return res.status(403).json({ error: 'Bu etkinliği düzenleme yetkiniz yok.' });
    }

    const startDate = startDateStr ? new Date(startDateStr) : existingEvent.startDate;
    const endDate = endDateStr ? new Date(endDateStr) : existingEvent.endDate;

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Bitiş tarihi başlangıç tarihinden sonra olmalı.' });
    }

    // Check conflicts if date/location/resources changed
    const dateChanged = startDateStr || endDateStr;
    const locationChanged = locationId !== undefined;
    const resourcesChanged = resourceIds !== undefined;

    if (dateChanged || locationChanged || resourcesChanged) {
      const locationConflicts = await checkLocationConflicts(
        locationId !== undefined ? locationId : existingEvent.locationId,
        startDate,
        endDate,
        id
      );

      const resourceConflicts = resourceIds?.length
        ? await checkResourceConflicts(resourceIds, startDate, endDate, id)
        : [];

      if (locationConflicts.length > 0) {
        return res.status(409).json({
          message: `Mekan dolu: ${locationConflicts[0].location?.name}`,
          conflict: true
        });
      }

      if (resourceConflicts.length > 0) {
        const resourceNames = resourceConflicts[0].conflictingResources.join(', ');
        return res.status(409).json({
          message: `Ekipman kullanımda: ${resourceNames}`,
          conflict: true
        });
      }
    }

    // Update event
    const updateData: any = {
      updatedById: req.user?.userId || null
    };

    if (title) updateData.title = title;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (description !== undefined) updateData.description = description;
    if (startDateStr) updateData.startDate = startDate;
    if (endDateStr) updateData.endDate = endDate;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (attendees !== undefined) updateData.attendees = parseInt(attendees);
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (requirements !== undefined) updateData.requirements = requirements || null;
    if (actualAttendees !== undefined) updateData.actualAttendees = actualAttendees ? parseInt(actualAttendees) : null;
    if (outcomeNotes !== undefined) updateData.outcomeNotes = outcomeNotes || null;

    // Only admin can change status
    if (isAdmin && status !== undefined) {
      updateData.status = status;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        location: true,
        eventResources: {
          include: { resource: true }
        }
      }
    });

    // Update resources if changed
    if (resourceIds !== undefined) {
      // Delete old resources
      await prisma.eventResource.deleteMany({ where: { eventId: id } });
      
      // Create new resources
      if (resourceIds.length > 0) {
        await prisma.eventResource.createMany({
          data: resourceIds.map((rid: string) => ({
            eventId: id,
            resourceId: rid,
            quantity: 1
          }))
        });
      }
    }

    // Log update
    await createEventLog(event.id, 'update', req.user?.userId || null, {
      changes: updateData,
      status: event.status
    });

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Güncelleme başarısız.' });
  }
});

// POST /api/events/:id/approve - Approve event (admin only)
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: 'APPROVED',
        updatedById: req.user?.userId || null
      },
      include: {
        department: true,
        location: true
      }
    });

    await createEventLog(event.id, 'approve', req.user?.userId || null, {
      title: event.title,
      previousStatus: 'PENDING',
      newStatus: 'APPROVED'
    });

    res.json(event);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Etkinlik bulunamadı.' });
    }
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Etkinlik onaylanamadı.' });
  }
});

// POST /api/events/:id/reject - Reject event (admin only)
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: 'REJECTED',
        updatedById: req.user?.userId || null
      },
      include: {
        department: true,
        location: true
      }
    });

    await createEventLog(event.id, 'reject', req.user?.userId || null, {
      title: event.title,
      previousStatus: 'PENDING',
      newStatus: 'REJECTED',
      reason: reason || null
    });

    res.json(event);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Etkinlik bulunamadı.' });
    }
    console.error('Reject event error:', error);
    res.status(500).json({ error: 'Etkinlik reddedilemedi.' });
  }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Etkinlik bulunamadı.' });
    }

    await createEventLog(event.id, 'delete', req.user?.userId || null, {
      title: event.title,
      status: event.status
    });

    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Silme işlemi başarısız.' });
  }
});

// GET /api/events/:id/logs - Get event logs (admin only)
router.get('/:id/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await prisma.eventLog.findMany({
      where: { eventId: id },
      include: {
        actor: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error('Get event logs error:', error);
    res.status(500).json({ error: 'Loglar getirilemedi.' });
  }
});

// GET /api/events/logs/all - Get all logs (admin only)
router.get('/logs/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.eventLog.findMany({
      include: {
        event: {
          select: { id: true, title: true }
        },
        actor: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 logs
    });

    res.json(logs);
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({ error: 'Loglar getirilemedi.' });
  }
});

export default router;
