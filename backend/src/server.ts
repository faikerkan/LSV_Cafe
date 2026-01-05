import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import userRoutes from './routes/userRoutes';
import configRoutes from './routes/configRoutes';
dotenv.config();

// Import logger and env with error handling
let logger: any;
let env: any;

try {
  logger = require('./lib/logger').default;
  env = require('./config/env').env;
} catch (error) {
  console.error('Failed to load logger or env config:', error);
  // Fallback logger
  logger = {
    info: (...args: any[]) => console.log(...args),
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args),
    debug: (...args: any[]) => console.log(...args),
  };
  // Fallback env
  env = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'production',
  };
}

const app = express();
const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - Allow all origins in production for now
// TODO: Set FRONTEND_URL environment variable for production
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LSV Cafe Event Manager API is running.',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' 
      ? 'Sunucu hatası oluştu.' 
      : err.message,
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} (${NODE_ENV})`);
});
