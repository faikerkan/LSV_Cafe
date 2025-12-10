import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Restricted CORS (Allow only frontend origin in production)
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // In dev, sometimes origin is localhost:3001
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('LSV Cafe Event Manager API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});