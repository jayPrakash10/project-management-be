import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL (or POSTGRES_URL) is required' }).url(),
  DB_SSL: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  DB_POOL_MAX: z.coerce.number().int().positive().default(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  // Fall back to the variable name the Vercel <-> Supabase integration creates.
  DATABASE_URL: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
});

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
