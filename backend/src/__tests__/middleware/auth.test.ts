import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

describe('Auth Middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should reject request without token', () => {
      authenticate(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Token') });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      req.headers = { authorization: 'InvalidFormat token123' };
      authenticate(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid token and set req.user', () => {
      const payload = { userId: '123', username: 'testuser', role: 'USER' as const };
      const token = jwt.sign(payload, JWT_SECRET);
      req.headers = { authorization: `Bearer ${token}` };

      authenticate(req as AuthRequest, res as Response, next);

      expect(req.user).toMatchObject(payload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const payload = { userId: '123', username: 'test', role: 'USER' as const };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });
      req.headers = { authorization: `Bearer ${token}` };

      authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('dolmuş') });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should reject request without user', () => {
      requireAdmin(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-admin user', () => {
      req.user = { userId: '123', username: 'user', role: 'USER' };
      requireAdmin(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('yönetici') });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin user', () => {
      req.user = { userId: '123', username: 'admin', role: 'ADMIN' };
      requireAdmin(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
