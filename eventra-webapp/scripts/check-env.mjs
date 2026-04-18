import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
}

const requiredSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const optionalSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
});

const required = requiredSchema.safeParse(process.env);
if (!required.success) {
  const missing = required.error.issues.map((issue) => issue.path.join('.')).join(', ');
  console.error(`Missing/invalid required env vars: ${missing}`);
  process.exit(1);
}

const optional = optionalSchema.safeParse(process.env);
if (!optional.success) {
  const invalid = optional.error.issues.map((issue) => issue.path.join('.')).join(', ');
  console.warn(`Optional env vars have invalid values: ${invalid}`);
}

const optionalMissing = [
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'GOOGLE_API_KEY',
].filter((name) => !process.env[name]);

if (optionalMissing.length > 0) {
  console.warn(`Optional integrations not configured: ${optionalMissing.join(', ')}`);
}

console.log('Environment validation passed for required variables.');
