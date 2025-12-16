import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: 'ADMIN' | 'USER';
  };
}

// JWT verification middleware
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token bulunamadı. Lütfen giriş yapın.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      role: 'ADMIN' | 'USER';
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Geçersiz token.' });
    }
    return res.status(500).json({ error: 'Kimlik doğrulama hatası.' });
  }
};

// Admin-only middleware
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Kimlik doğrulaması gerekli.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekli.' });
  }

  next();
};

// Optional auth: attach user if token exists, but don't require it
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        username: string;
        role: 'ADMIN' | 'USER';
      };
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Invalid token, but continue without user
    next();
  }
};
