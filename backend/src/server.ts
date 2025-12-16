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

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

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

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (NODE_ENV === 'development') return callback(null, true);
    
    // In production, check whitelist
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS policy: Origin not allowed'));
  },
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (${NODE_ENV})`);
});
