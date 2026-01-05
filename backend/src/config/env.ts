import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'), // Reduced for backward compatibility
  
  // Server
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Frontend
  FRONTEND_URL: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
  
  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
});

// Validate environment variables (with fallbacks for production)
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('⚠️ Environment variable validation warnings:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // In production, use defaults instead of exiting
      if (process.env.NODE_ENV === 'production') {
        console.warn('Using default values for missing/invalid environment variables');
        return {
          DATABASE_URL: process.env.DATABASE_URL || '',
          JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
          PORT: parseInt(process.env.PORT || '3000'),
          NODE_ENV: (process.env.NODE_ENV as any) || 'production',
          FRONTEND_URL: process.env.FRONTEND_URL,
          LOG_LEVEL: process.env.LOG_LEVEL as any,
          SENTRY_DSN: process.env.SENTRY_DSN,
        };
      }
      // In development/test, exit on error
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
