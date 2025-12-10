import request from 'supertest';
import express from 'express';
import * as bcrypt from 'bcryptjs';
import authRoutes from '../../routes/authRoutes';
import prisma from '../../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: '123',
                username: 'admin',
                passwordHash: await bcrypt.hash('admin123', 10),
                role: 'ADMIN',
                createdAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toEqual({
                username: 'admin',
                role: 'ADMIN',
            });
        });

        it('should fail with non-existent user', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nonexistent', password: 'password' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Kullanıcı bulunamadı.');
        });

        it('should fail with incorrect password', async () => {
            const mockUser = {
                id: '123',
                username: 'admin',
                passwordHash: await bcrypt.hash('admin123', 10),
                role: 'ADMIN',
                createdAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Hatalı şifre.');
        });

        it('should handle server errors gracefully', async () => {
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Sunucu hatası.');
        });

        it('should default to admin username if not provided', async () => {
            const mockUser = {
                id: '123',
                username: 'admin',
                passwordHash: await bcrypt.hash('admin123', 10),
                role: 'ADMIN',
                createdAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'admin123' });

            expect(response.status).toBe(200);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'admin' },
            });
        });
    });
});
