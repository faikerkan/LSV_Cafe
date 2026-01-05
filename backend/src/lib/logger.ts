import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'lsv-cafe-api' },
  transports: [
    // Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// In development, add colored console output
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create logs directory if it doesn't exist (only if not in production or if directory writable)
import { existsSync, mkdirSync } from 'fs';
import { accessSync, constants } from 'fs';

try {
  if (!existsSync('logs')) {
    mkdirSync('logs', { recursive: true });
  }
} catch (error) {
  // If we can't create logs directory, just log to console
  console.warn('Could not create logs directory, logging to console only');
}

export default logger;
