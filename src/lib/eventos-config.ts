/**
 * EventOS Configuration
 * Central configuration for the EventOS SaaS platform
 */

export const EVENTOS_CONFIG = {
  // Platform Information
  platform: {
    name: 'EventOS',
    description: 'Intelligent Event Management SaaS Platform',
    version: '1.0.0',
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
  },

  // Multi-tenant Configuration
  multiTenant: {
    enabled: true,
    defaultPlan: 'free',
    maxOrganizationsPerUser: 5,
    customDomainEnabled: true,
  },

  // Enhanced User Roles
  roles: {
    // Core Roles
    ATTENDEE: 'attendee',
    SPEAKER: 'speaker', 
    ORGANIZER: 'organizer',
    
    // Enhanced Roles
    ADMIN: 'admin',           // Platform admin
    MODERATOR: 'moderator',   // Event moderator
    VENDOR: 'vendor',         // Service provider
    VOLUNTEER: 'volunteer',   // Event volunteer
    SPONSOR: 'sponsor',       // Event sponsor
    MEDIA: 'media',           // Press/media
  } as const,

  // Subscription Plans
  plans: {
    FREE: {
      id: 'free',
      name: 'Free',
      price: 0,
      features: {
        maxEvents: 1,
        maxAttendees: 100,
        basicAnalytics: true,
        aiRecommendations: false,
        customBranding: false,
        googleIntegration: false,
        automationWorkflows: 0,
        advancedInsights: false,
        prioritySupport: false,
      },
    },
    PRO: {
      id: 'pro',
      name: 'Pro',
      price: 49,
      features: {
        maxEvents: 10,
        maxAttendees: 1000,
        basicAnalytics: true,
        aiRecommendations: true,
        customBranding: true,
        googleIntegration: true,
        automationWorkflows: 5,
        advancedInsights: true,
        prioritySupport: false,
      },
    },
    ENTERPRISE: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      features: {
        maxEvents: -1, // Unlimited
        maxAttendees: -1,
        basicAnalytics: true,
        aiRecommendations: true,
        customBranding: true,
        googleIntegration: true,
        automationWorkflows: -1,
        advancedInsights: true,
        prioritySupport: true,
        whiteLabel: true,
        ssoIntegration: true,
        apiAccess: true,
      },
    },
  },

  // AI Configuration
  ai: {
    providers: {
      openai: {
        enabled: true,
        models: ['gpt-4o', 'gpt-4o-mini'],
        defaultModel: 'gpt-4o-mini',
      },
      gemini: {
        enabled: true,
        models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
        defaultModel: 'gemini-1.5-flash',
      },
    },
    features: {
      recommendations: true,
      chatbot: true,
      insights: true,
      automation: true,
      predictiveAnalytics: true,
      sentimentAnalysis: true,
    },
  },

  // Integration Configuration
  integrations: {
    google: {
      workspace: {
        enabled: true,
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/calendar',
        ],
      },
    },
    payments: {
      stripe: {
        enabled: true,
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      razorpay: {
        enabled: true,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    },
    communications: {
      sendgrid: {
        enabled: true,
        apiKey: process.env.SENDGRID_API_KEY,
      },
      twilio: {
        enabled: false,
        accountSid: process.env.TWILIO_ACCOUNT_SID,
      },
    },
    automation: {
      n8n: {
        enabled: true,
        baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
        apiKey: process.env.N8N_API_KEY,
      },
    },
  },

  // Firebase Configuration (Production)
  firebase: {
    config: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    emulator: {
      enabled: process.env.NODE_ENV === 'development',
      auth: { host: 'localhost', port: 9099 },
      firestore: { host: 'localhost', port: 8080 },
      functions: { host: 'localhost', port: 5001 },
      storage: { host: 'localhost', port: 9199 },
    },
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    auditLogging: true,
    gdprCompliance: true,
  },

  // UI/UX Configuration
  ui: {
    theme: {
      defaultMode: 'light',
      supportsDarkMode: true,
      primaryFont: 'Playfair Display',
      bodyFont: 'PT Sans',
      glassEffect: true,
    },
    features: {
      animations: true,
      transitions: true,
      glassmorphism: true,
      mobilePWA: true,
    },
  },

  // Analytics Configuration
  analytics: {
    providers: {
      firebase: true,
      googleAnalytics: process.env.NEXT_PUBLIC_GA_ID,
      mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    },
    events: {
      pageViews: true,
      userActions: true,
      errorTracking: true,
      performanceMonitoring: true,
    },
  },

  // API Configuration
  api: {
    version: 'v1',
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    },
  },

  // Feature Flags
  features: {
    multiTenant: true,
    aiChatbot: true,
    advancedAnalytics: true,
    googleIntegration: true,
    paymentProcessing: true,
    automationWorkflows: true,
    mobileApp: true,
    whiteLabeling: true,
    apiMarketplace: false, // Coming soon
    blockchainIntegration: false, // Future feature
  },
};

// Type definitions for better TypeScript support
export type EventOSRole = typeof EVENTOS_CONFIG.roles[keyof typeof EVENTOS_CONFIG.roles];
export type SubscriptionPlan = keyof typeof EVENTOS_CONFIG.plans;
export type AIProvider = keyof typeof EVENTOS_CONFIG.ai.providers;

// Helper functions
export const getRolePermissions = (role: string) => {
  const roleHierarchy = {
    admin: ['admin', 'organizer', 'moderator', 'speaker', 'attendee'],
    organizer: ['organizer', 'moderator', 'speaker', 'attendee'],
    moderator: ['moderator', 'speaker', 'attendee'],
    speaker: ['speaker', 'attendee'],
    attendee: ['attendee'],
    vendor: ['vendor', 'attendee'],
    volunteer: ['volunteer', 'attendee'],
    sponsor: ['sponsor', 'attendee'],
    media: ['media', 'attendee'],
  };
  
  return roleHierarchy[role as keyof typeof roleHierarchy] || ['attendee'];
};

export const canAccessFeature = (userPlan: string, feature: string): boolean => {
  const plan = EVENTOS_CONFIG.plans[userPlan.toUpperCase() as SubscriptionPlan];
  if (!plan) return false;
  
  return (plan.features as any)[feature] === true || (plan.features as any)[feature] > 0;
};

export const isFeatureEnabled = (feature: keyof typeof EVENTOS_CONFIG.features): boolean => {
  return EVENTOS_CONFIG.features[feature];
};