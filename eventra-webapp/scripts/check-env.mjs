import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import postgres from 'postgres';
import twilio from 'twilio';

function parseArgs(argv) {
  const args = {
    mode: 'local',
    envFile: null,
    checkConnectivity: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--mode' && argv[i + 1]) {
      args.mode = argv[i + 1];
      i += 1;
    } else if (token === '--env-file' && argv[i + 1]) {
      args.envFile = argv[i + 1];
      i += 1;
    } else if (token === '--check-connectivity') {
      args.checkConnectivity = true;
    }
  }

  return args;
}

const args = parseArgs(process.argv);

async function loadEnv() {
  const dotenv = await import('dotenv');
  const paths = [];

  if (args.envFile) {
    paths.push(resolve(process.cwd(), args.envFile));
  } else {
    paths.push(resolve(process.cwd(), '.env'));
    paths.push(resolve(process.cwd(), '.env.local'));
  }

  for (const filePath of paths) {
    if (existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}

await loadEnv();

const requiredSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const stagingRequiredSchema = requiredSchema.extend({
  RESEND_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_FROM_NUMBER: z.string().min(1),
});

const optionalSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
});

const selectedRequiredSchema = args.mode === 'staging' ? stagingRequiredSchema : requiredSchema;
const required = selectedRequiredSchema.safeParse(process.env);
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

console.log(`Environment validation passed for required variables (mode=${args.mode}).`);

async function checkDatabase() {
  const db = postgres(process.env.DATABASE_URL, {
    ssl: !/localhost|127\.0\.0\.1/i.test(process.env.DATABASE_URL) ? 'require' : false,
    connect_timeout: 10,
    max: 1,
    prepare: false,
  });
  try {
    await db`select 1 as ok`;
    console.log('Connectivity check: database OK');
  } finally {
    await db.end({ timeout: 5 });
  }
}

async function checkSupabase() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase health check failed with status ${response.status}`);
  }
  console.log('Connectivity check: supabase OK');
}

async function checkResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Connectivity check: resend SKIPPED (RESEND_API_KEY not set)');
    return;
  }

  const response = await fetch('https://api.resend.com/domains', {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Resend check failed with status ${response.status}`);
  }

  console.log('Connectivity check: resend OK');
}

async function checkTwilio() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('Connectivity check: twilio SKIPPED (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not set)');
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
  console.log('Connectivity check: twilio OK');
}

if (args.checkConnectivity) {
  await checkDatabase();
  await checkSupabase();
  await checkResend();
  await checkTwilio();
  console.log('All requested connectivity checks completed.');
}
