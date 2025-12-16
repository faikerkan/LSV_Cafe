import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import userRoutes from '../../routes/userRoutes';
import prisma from '../../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

const generateToken = (role: 'ADMIN' | 'USER') => {
  return jwt.sign(
    { userId: 'test-user-id', username: 'testuser', role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

jest.mock('../../lib/prisma', () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

describe('User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      const token = generateToken('USER');
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should return users for admin', async () => {
      const mockUsers = [
        { id: '1', username: 'admin', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date() }
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const token = generateToken('ADMIN');
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with admin token', async () => {
      const newUser = {
        username: 'newuser',
        password: 'password123',
        role: 'USER'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '2',
        username: 'newuser',
        role: 'USER',
        createdAt: new Date()
      });

      const token = generateToken('ADMIN');
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.username).toBe('newuser');
    });

    it('should reject duplicate username', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', username: 'existing' });

      const token = generateToken('ADMIN');
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'existing', password: '123456' });

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should prevent self-deletion', async () => {
      const token = jwt.sign(
        { userId: 'self-id', username: 'admin', role: 'ADMIN' },
        JWT_SECRET
      );

      const res = await request(app)
        .delete('/api/users/self-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
