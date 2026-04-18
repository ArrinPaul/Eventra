import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_DOMAIN: z.string().min(1).default('localhost:9002'),
});

const serverEnvSchema = publicEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
});

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;
let cachedPublicEnv: z.infer<typeof publicEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.path.join('.') || issue.message).join(', ');
    throw new Error(`Invalid server environment variables: ${issues}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getPublicEnv() {
  if (cachedPublicEnv) return cachedPublicEnv;

  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.path.join('.') || issue.message).join(', ');
    throw new Error(`Invalid public environment variables: ${issues}`);
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}
