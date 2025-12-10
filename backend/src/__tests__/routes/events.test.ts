import request from 'supertest';
import express from 'express';
import eventRoutes from '../../routes/eventRoutes';
import prisma from '../../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/events', eventRoutes);

describe('Event Routes', () => {
    describe('GET /api/events', () => {
        it('should return all events', async () => {
            const mockEvents = [
                {
                    id: '1',
                    title: 'Test Event 1',
                    department: 'IT',
                    description: 'Test Description',
                    startDate: new Date('2025-01-15T10:00:00Z'),
                    endDate: new Date('2025-01-15T12:00:00Z'),
                    status: 'Onay Bekliyor',
                    location: 'LSV Cafe',
                    attendees: 20,
                    contactPerson: 'John Doe',
                    requirements: null,
                    resources: ['Projeksiyon'],
                    actualAttendees: null,
                    outcomeNotes: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);

            const response = await request(app).get('/api/events');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].title).toBe('Test Event 1');
        });

        it('should handle database errors', async () => {
            (prisma.event.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app).get('/api/events');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Etkinlikler getirilemedi.');
        });
    });

    describe('POST /api/events', () => {
        it('should create event successfully when no conflicts', async () => {
            const newEvent = {
                title: 'New Event',
                department: 'HR',
                description: 'Team Building',
                startDate: '2025-02-01T14:00:00Z',
                endDate: '2025-02-01T16:00:00Z',
                status: 'Onay Bekliyor',
                location: 'LSV Cafe',
                attendees: 30,
                contactPerson: 'Jane Smith',
                resources: ['Projeksiyon'],
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.event.create as jest.Mock).mockResolvedValue({
                id: '123',
                ...newEvent,
                startDate: new Date(newEvent.startDate),
                endDate: new Date(newEvent.endDate),
                requirements: null,
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const response = await request(app)
                .post('/api/events')
                .send(newEvent);

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('New Event');
        });

        it('should reject event with location conflict', async () => {
            const newEvent = {
                title: 'New Event',
                department: 'HR',
                description: 'Team Building',
                startDate: '2025-02-01T14:00:00Z',
                endDate: '2025-02-01T16:00:00Z',
                status: 'Onay Bekliyor',
                location: 'LSV Cafe',
                attendees: 30,
                contactPerson: 'Jane Smith',
                resources: [],
            };

            const existingEvent = {
                id: '999',
                title: 'Existing Event',
                department: 'IT',
                description: 'Existing',
                startDate: new Date('2025-02-01T13:00:00Z'),
                endDate: new Date('2025-02-01T15:00:00Z'),
                status: 'Onaylandı',
                location: 'LSV Cafe',
                attendees: 20,
                contactPerson: 'John Doe',
                requirements: null,
                resources: [],
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([existingEvent]);

            const response = await request(app)
                .post('/api/events')
                .send(newEvent);

            expect(response.status).toBe(409);
            expect(response.body.conflict).toBe(true);
            expect(response.body.message).toContain('Mekan dolu');
        });

        it('should reject event with resource conflict', async () => {
            const newEvent = {
                title: 'New Event',
                department: 'HR',
                description: 'Team Building',
                startDate: '2025-02-01T14:00:00Z',
                endDate: '2025-02-01T16:00:00Z',
                status: 'Onay Bekliyor',
                location: 'Conference Room A',
                attendees: 30,
                contactPerson: 'Jane Smith',
                resources: ['Projeksiyon'],
            };

            const existingEvent = {
                id: '999',
                title: 'Existing Event',
                department: 'IT',
                description: 'Existing',
                startDate: new Date('2025-02-01T13:00:00Z'),
                endDate: new Date('2025-02-01T15:00:00Z'),
                status: 'Onaylandı',
                location: 'Conference Room B',
                attendees: 20,
                contactPerson: 'John Doe',
                requirements: null,
                resources: ['Projeksiyon'],
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([existingEvent]);

            const response = await request(app)
                .post('/api/events')
                .send(newEvent);

            expect(response.status).toBe(409);
            expect(response.body.conflict).toBe(true);
            expect(response.body.message).toContain('Ekipman kullanımda');
        });

        it('should allow event when existing event is rejected', async () => {
            const newEvent = {
                title: 'New Event',
                department: 'HR',
                description: 'Team Building',
                startDate: '2025-02-01T14:00:00Z',
                endDate: '2025-02-01T16:00:00Z',
                status: 'Onay Bekliyor',
                location: 'LSV Cafe',
                attendees: 30,
                contactPerson: 'Jane Smith',
                resources: [],
            };

            const rejectedEvent = {
                id: '999',
                title: 'Rejected Event',
                department: 'IT',
                description: 'Rejected',
                startDate: new Date('2025-02-01T13:00:00Z'),
                endDate: new Date('2025-02-01T15:00:00Z'),
                status: 'REJECTED',
                location: 'LSV Cafe',
                attendees: 20,
                contactPerson: 'John Doe',
                requirements: null,
                resources: [],
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // First call checks for conflicts (should return empty due to REJECTED status filter)
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

            (prisma.event.create as jest.Mock).mockResolvedValue({
                id: '123',
                ...newEvent,
                startDate: new Date(newEvent.startDate),
                endDate: new Date(newEvent.endDate),
                requirements: null,
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const response = await request(app)
                .post('/api/events')
                .send(newEvent);

            expect(response.status).toBe(201);
        });
    });

    describe('PUT /api/events/:id', () => {
        it('should update event successfully', async () => {
            const updateData = {
                title: 'Updated Event',
                department: 'IT',
                description: 'Updated Description',
                startDate: '2025-03-01T10:00:00Z',
                endDate: '2025-03-01T12:00:00Z',
                status: 'Onaylandı',
                location: 'LSV Cafe',
                attendees: 25,
                contactPerson: 'John Updated',
                resources: ['Ses Sistemi'],
                requirements: 'Updated requirements',
                actualAttendees: null,
                outcomeNotes: null,
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.event.update as jest.Mock).mockResolvedValue({
                id: '123',
                ...updateData,
                startDate: new Date(updateData.startDate),
                endDate: new Date(updateData.endDate),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const response = await request(app)
                .put('/api/events/123')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Event');
        });

        it('should reject update with conflicts', async () => {
            const updateData = {
                title: 'Updated Event',
                department: 'IT',
                description: 'Updated Description',
                startDate: '2025-03-01T10:00:00Z',
                endDate: '2025-03-01T12:00:00Z',
                status: 'Onaylandı',
                location: 'LSV Cafe',
                attendees: 25,
                contactPerson: 'John Updated',
                resources: [],
            };

            const conflictingEvent = {
                id: '456',
                title: 'Conflicting Event',
                department: 'HR',
                description: 'Conflict',
                startDate: new Date('2025-03-01T09:00:00Z'),
                endDate: new Date('2025-03-01T11:00:00Z'),
                status: 'Onaylandı',
                location: 'LSV Cafe',
                attendees: 20,
                contactPerson: 'Jane Doe',
                requirements: null,
                resources: [],
                actualAttendees: null,
                outcomeNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([conflictingEvent]);

            const response = await request(app)
                .put('/api/events/123')
                .send(updateData);

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Mekan dolu');
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete event successfully', async () => {
            (prisma.event.delete as jest.Mock).mockResolvedValue({
                id: '123',
            });

            const response = await request(app).delete('/api/events/123');

            expect(response.status).toBe(204);
        });

        it('should handle deletion errors', async () => {
            (prisma.event.delete as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app).delete('/api/events/999');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Silme işlemi başarısız.');
        });
    });
});
