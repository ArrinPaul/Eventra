/**
 * Feature Gate Component
 * 
 * Wraps features that require specific services to be configured.
 * Shows a helpful message when the feature isn't available.
 */

'use client';

import { ReactNode } from 'react';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings, AlertCircle, Info } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type FeatureType = 'ai' | 'googleIntegrations' | 'payments' | 'notifications' | 'analytics';

interface FeatureGateProps {
  feature: FeatureType;
  children: ReactNode;
  fallback?: ReactNode;
  showSetupInstructions?: boolean;
}

// ============================================================
// Feature Metadata
// ============================================================

const featureConfig: Record<FeatureType, {
  title: string;
  description: string;
  envVars: string[];
  docsUrl?: string;
}> = {
  ai: {
    title: 'AI Features',
    description: 'AI-powered chatbots, recommendations, and insights',
    envVars: ['GOOGLE_GENAI_API_KEY'],
    docsUrl: 'https://makersuite.google.com/app/apikey',
  },
  googleIntegrations: {
    title: 'Google Integrations',
    description: 'Google Sign-In, Calendar sync, and Workspace integration',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
  },
  payments: {
    title: 'Payment Processing',
    description: 'Ticket sales and payment processing via Stripe',
    envVars: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
    docsUrl: 'https://dashboard.stripe.com/apikeys',
  },
  notifications: {
    title: 'Email Notifications',
    description: 'Email notifications for events and updates',
    envVars: ['SENDGRID_API_KEY', '(or RESEND_API_KEY)'],
    docsUrl: 'https://sendgrid.com',
  },
  analytics: {
    title: 'Analytics',
    description: 'Event analytics and reporting',
    envVars: ['NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'],
    docsUrl: 'https://analytics.google.com',
  },
};

// ============================================================
// Feature Check Function
// ============================================================

function checkFeatureEnabled(feature: FeatureType, flags: ReturnType<typeof useFeatureFlags>): boolean {
  switch (feature) {
    case 'ai':
      return flags.isAIEnabled;
    case 'googleIntegrations':
      return flags.isGoogleIntegrationsEnabled;
    case 'payments':
      return flags.isPaymentsEnabled;
    case 'notifications':
      return flags.isNotificationsEnabled;
    case 'analytics':
      return flags.isAnalyticsEnabled;
    default:
      return false;
  }
}

// ============================================================
// Components
// ============================================================

/**
 * Feature Gate - wraps content that requires a specific feature
 */
export function FeatureGate({ feature, children, fallback, showSetupInstructions = true }: FeatureGateProps) {
  const flags = useFeatureFlags();
  const isEnabled = checkFeatureEnabled(feature, flags);

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showSetupInstructions) {
    return <FeatureUnavailable feature={feature} />;
  }

  return null;
}

/**
 * Feature Unavailable Card - shows when a feature isn't configured
 */
export function FeatureUnavailable({ feature, compact = false }: { feature: FeatureType; compact?: boolean }) {
  const config = featureConfig[feature];

  if (compact) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{config.title} Not Available</AlertTitle>
        <AlertDescription>
          Configure {config.envVars.join(', ')} to enable this feature.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">{config.title} Not Configured</CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">To enable this feature, add these to your .env.local:</p>
          <div className="bg-background rounded border p-3 font-mono text-sm">
            {config.envVars.map((envVar, index) => (
              <div key={index} className="text-muted-foreground">
                {envVar}=your-value-here
              </div>
            ))}
          </div>
        </div>
        
        {config.docsUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={config.docsUrl} target="_blank" rel="noopener noreferrer">
              Get API Keys →
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Configuration Status Banner - shows overview of what's configured
 */
export function ConfigurationStatusBanner() {
  const flags = useFeatureFlags();
  
  const unconfiguredFeatures = [
    !flags.isGoogleAIConfigured && 'AI Features',
    !flags.isGoogleOAuthConfigured && 'Google Integrations',
    !flags.isStripeConfigured && 'Payments',
    !flags.isEmailConfigured && 'Notifications',
  ].filter(Boolean);

  if (unconfiguredFeatures.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Optional Features Not Configured</AlertTitle>
      <AlertDescription>
        <p className="mb-2">Some features are disabled because their services are not configured.</p>
        <p className="text-sm">Missing: {unconfiguredFeatures.join(', ')}</p>
        <p className="text-sm mt-1">See <code className="bg-muted px-1 rounded">.env.example</code> for configuration details.</p>
      </AlertDescription>
    </Alert>
  );
}