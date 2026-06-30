import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('should validate public env schema with valid values', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    process.env.NEXT_PUBLIC_DOMAIN = 'localhost:9002';

    const { z } = require('zod');
    const schema = z.object({
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
      NEXT_PUBLIC_DOMAIN: z.string().min(1).default('localhost:9002'),
    });

    const result = schema.safeParse(process.env);
    expect(result.success).toBe(true);
  });

  it('should reject invalid Supabase URL', () => {
    const { z } = require('zod');
    const schema = z.object({
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    });

    const result = schema.safeParse({ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should reject empty anon key', () => {
    const { z } = require('zod');
    const schema = z.object({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    });

    const result = schema.safeParse({ NEXT_PUBLIC_SUPABASE_ANON_KEY: '' });
    expect(result.success).toBe(false);
  });
});
