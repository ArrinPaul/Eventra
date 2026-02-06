/**
 * Feature Flag Hook
 * 
 * Provides React components with easy access to feature availability
 * and graceful degradation when features aren't configured.
 */

'use client';

import { envConfig, isFeatureAvailable, getFeatureUnavailableMessage } from '@/core/config/env-config';

// ============================================================
// Hook for Feature Availability
// ============================================================

export function useFeatureFlags() {
  return {
    // Individual feature checks
    isAIEnabled: envConfig.features.aiEnabled,
    isGoogleIntegrationsEnabled: envConfig.features.googleIntegrationsEnabled,
    isPaymentsEnabled: envConfig.features.paymentsEnabled,
    isAnalyticsEnabled: envConfig.features.analyticsEnabled,
    isNotificationsEnabled: envConfig.features.notificationsEnabled,
    
    // Service configuration status
    isGoogleAIConfigured: envConfig.googleAI.isConfigured,
    isGoogleOAuthConfigured: envConfig.googleOAuth.isConfigured,
    isEmailConfigured: envConfig.email.isConfigured,
    isStripeConfigured: envConfig.stripe.isConfigured,
    
    // Helper functions
    isFeatureAvailable,
    getUnavailableMessage: getFeatureUnavailableMessage,
    
    // Full config access
    config: envConfig,
  };
}

// ============================================================
// Type Exports
// ============================================================

export type FeatureFlags = ReturnType<typeof useFeatureFlags>;