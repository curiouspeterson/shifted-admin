/**
 * Environment Configuration
 * Last Updated: 2025-01-17
 * 
 * Type-safe environment variable configuration using Zod.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Redis configuration
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1),

  // API configuration
  API_URL: z.string().url().default('http://localhost:3000/api'),
  API_KEY: z.string().optional(),

  // Authentication configuration
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.boolean().default(false),

  // Database configuration
  DATABASE_URL: z.string().url(),
  DATABASE_AUTH_TOKEN: z.string().min(1),

  // Application configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_NAME: z.string().default('Shifted Admin'),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse({
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
  API_URL: process.env.API_URL,
  API_KEY: process.env.API_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST === 'true',
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  APP_NAME: process.env.APP_NAME,
});

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedEnv.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parsedEnv.data; 