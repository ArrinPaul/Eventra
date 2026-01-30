/**
 * Environment Configuration with Fallback System
 * 
 * This module provides:
 * 1. Type-safe environment variable access
 * 2. Validation to ensure required variables are set
 * 3. Fallback defaults for optional variables
 * 4. Feature flags based on configuration status
 */

// ============================================================
// Types
// ============================================================

export interface EnvConfig {
  // Site
  siteUrl: string;
  domain: string;
  nodeEnv: 'development' | 'production' | 'test';

  // Firebase
  firebase: {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
    measurementId: string | undefined;
    isConfigured: boolean;
  };

  // Google AI
  googleAI: {
    apiKey: string | undefined;
    isConfigured: boolean;
  };

  // Google OAuth
  googleOAuth: {
    clientId: string | undefined;
    clientSecret: string | undefined;
    isConfigured: boolean;
  };

  // Email
  email: {
    from: string;
    sendgridApiKey: string | undefined;
    resendApiKey: string | undefined;
    isConfigured: boolean;
  };

  // Payments
  stripe: {
    publishableKey: string | undefined;
    secretKey: string | undefined;
    webhookSecret: string | undefined;
    isConfigured: boolean;
  };

  // Feature Flags
  features: {
    aiEnabled: boolean;
    googleIntegrationsEnabled: boolean;
    paymentsEnabled: boolean;
    analyticsEnabled: boolean;
    notificationsEnabled: boolean;
    useFirebaseEmulator: boolean;
  };
}

// ============================================================
// Environment Variable Getter with Fallback
// ============================================================

function getEnvVar(key: string, fallback?: string): string | undefined {
  const value = process.env[key];
  if (value !== undefined && value !== '' && value !== 'undefined') {
    return value;
  }
  return fallback;
}

function getBooleanEnvVar(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

// ============================================================
// Build Configuration
// ============================================================

function buildEnvConfig(): EnvConfig {
  // Firebase Configuration
  const firebaseApiKey = getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY');
  const firebaseAuthDomain = getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  const firebaseProjectId = getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const firebaseStorageBucket = getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  const firebaseMessagingSenderId = getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  const firebaseAppId = getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID');
  const firebaseMeasurementId = getEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID');
  
  const firebaseIsConfigured = !!(
    firebaseApiKey &&
    firebaseAuthDomain &&
    firebaseProjectId &&
    firebaseAppId
  );

  // Google AI Configuration
  const googleAIApiKey = getEnvVar('GOOGLE_GENAI_API_KEY');
  const googleAIIsConfigured = !!googleAIApiKey;

  // Google OAuth Configuration
  const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
  const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
  const googleOAuthIsConfigured = !!(googleClientId && googleClientSecret);

  // Email Configuration
  const emailFrom = getEnvVar('EMAIL_FROM', 'noreply@eventra.app')!;
  const sendgridApiKey = getEnvVar('SENDGRID_API_KEY');
  const resendApiKey = getEnvVar('RESEND_API_KEY');
  const emailIsConfigured = !!(sendgridApiKey || resendApiKey);

  // Stripe Configuration
  const stripePublishableKey = getEnvVar('STRIPE_PUBLISHABLE_KEY');
  const stripeSecretKey = getEnvVar('STRIPE_SECRET_KEY');
  const stripeWebhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET');
  const stripeIsConfigured = !!(stripePublishableKey && stripeSecretKey);

  // Feature Flags (with automatic fallback based on configuration)
  const nodeEnv = (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test');

  return {
    // Site
    siteUrl: getEnvVar('NEXT_PUBLIC_SITE_URL', 'http://localhost:9002')!,
    domain: getEnvVar('NEXT_PUBLIC_DOMAIN', 'localhost:9002')!,
    nodeEnv,

    // Firebase
    firebase: {
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId,
      isConfigured: firebaseIsConfigured,
    },

    // Google AI
    googleAI: {
      apiKey: googleAIApiKey,
      isConfigured: googleAIIsConfigured,
    },

    // Google OAuth
    googleOAuth: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      isConfigured: googleOAuthIsConfigured,
    },

    // Email
    email: {
      from: emailFrom,
      sendgridApiKey,
      resendApiKey,
      isConfigured: emailIsConfigured,
    },

    // Stripe
    stripe: {
      publishableKey: stripePublishableKey,
      secretKey: stripeSecretKey,
      webhookSecret: stripeWebhookSecret,
      isConfigured: stripeIsConfigured,
    },

    // Feature Flags - auto-disable if services aren't configured
    features: {
      aiEnabled: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_AI_FEATURES', googleAIIsConfigured),
      googleIntegrationsEnabled: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_GOOGLE_INTEGRATIONS', googleOAuthIsConfigured),
      paymentsEnabled: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_PAYMENTS', stripeIsConfigured),
      analyticsEnabled: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', true),
      notificationsEnabled: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_NOTIFICATIONS', emailIsConfigured),
      useFirebaseEmulator: getBooleanEnvVar('USE_FIREBASE_EMULATOR', nodeEnv === 'development'),
    },
  };
}

// ============================================================
// Export Singleton Configuration
// ============================================================

export const envConfig = buildEnvConfig();

// ============================================================
// Validation & Warnings
// ============================================================

/**
 * Validate that required environment variables are set
 * Call this at app startup to catch configuration issues early
 */
export function validateEnvConfig(): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Firebase is required for the app to function
  if (!envConfig.firebase.isConfigured) {
    errors.push(
      'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables. ' +
      'See .env.example for details.'
    );
  }

  // Google AI - warn if not configured
  if (!envConfig.googleAI.isConfigured) {
    warnings.push(
      'Google AI (Genkit) is not configured. AI features will be disabled. ' +
      'Set GOOGLE_GENAI_API_KEY to enable AI chatbots and recommendations.'
    );
  }

  // Google OAuth - warn if not configured
  if (!envConfig.googleOAuth.isConfigured) {
    warnings.push(
      'Google OAuth is not configured. Google Sign-In and Calendar/Workspace integrations will be disabled. ' +
      'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.'
    );
  }

  // Email - warn if not configured
  if (!envConfig.email.isConfigured) {
    warnings.push(
      'Email service is not configured. Email notifications will be disabled. ' +
      'Set SENDGRID_API_KEY or RESEND_API_KEY to enable.'
    );
  }

  // Stripe - warn if not configured
  if (!envConfig.stripe.isConfigured) {
    warnings.push(
      'Stripe is not configured. Payment features will be disabled. ' +
      'Set STRIPE_* environment variables to enable ticketing payments.'
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Log configuration status to console (for development)
 */
export function logEnvConfigStatus(): void {
  if (envConfig.nodeEnv === 'production') {
    return; // Don't log in production
  }

  console.log('\n📋 EventOS Configuration Status:');
  console.log('================================');
  console.log(`Environment: ${envConfig.nodeEnv}`);
  console.log(`Site URL: ${envConfig.siteUrl}`);
  console.log('');
  console.log('Services:');
  console.log(`  ✅ Firebase: ${envConfig.firebase.isConfigured ? 'Configured' : '❌ Not configured'}`);
  console.log(`  ${envConfig.googleAI.isConfigured ? '✅' : '⚠️'} Google AI: ${envConfig.googleAI.isConfigured ? 'Configured' : 'Not configured (AI disabled)'}`);
  console.log(`  ${envConfig.googleOAuth.isConfigured ? '✅' : '⚠️'} Google OAuth: ${envConfig.googleOAuth.isConfigured ? 'Configured' : 'Not configured (integrations disabled)'}`);
  console.log(`  ${envConfig.email.isConfigured ? '✅' : '⚠️'} Email: ${envConfig.email.isConfigured ? 'Configured' : 'Not configured (notifications disabled)'}`);
  console.log(`  ${envConfig.stripe.isConfigured ? '✅' : '⚠️'} Stripe: ${envConfig.stripe.isConfigured ? 'Configured' : 'Not configured (payments disabled)'}`);
  console.log('');
  console.log('Features:');
  console.log(`  AI Features: ${envConfig.features.aiEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Google Integrations: ${envConfig.features.googleIntegrationsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Payments: ${envConfig.features.paymentsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Notifications: ${envConfig.features.notificationsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Firebase Emulator: ${envConfig.features.useFirebaseEmulator ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('================================\n');
}

// ============================================================
// Helper Functions for Components
// ============================================================

/**
 * Check if a feature is available (configured and enabled)
 */
export function isFeatureAvailable(feature: keyof EnvConfig['features']): boolean {
  return envConfig.features[feature];
}

/**
 * Get a helpful message for unconfigured features
 */
export function getFeatureUnavailableMessage(feature: string): string {
  const messages: Record<string, string> = {
    ai: 'AI features are not available. Please configure GOOGLE_GENAI_API_KEY in your environment.',
    googleIntegrations: 'Google integrations are not available. Please configure Google OAuth credentials.',
    payments: 'Payment features are not available. Please configure Stripe credentials.',
    notifications: 'Email notifications are not available. Please configure an email service.',
  };
  return messages[feature] || `${feature} is not configured.`;
}
