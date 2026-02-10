import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EVENTOS_CONFIG, isFeatureEnabled, canAccessFeature } from '@/core/config/eventos-config';

export interface AIAuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  userRole: string | null;
  userPlan: string | null;
  error?: NextResponse;
}

/**
 * Validates an AI request for authentication and feature flags
 */
export async function validateAIRequest(
  request: NextRequest, 
  featureKey: keyof typeof EVENTOS_CONFIG.ai.features | string
): Promise<AIAuthResult> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;
  const userId = cookieStore.get('user-id')?.value || null;
  const userRole = cookieStore.get('user-role')?.value || 'attendee';
  const userPlan = cookieStore.get('user-plan')?.value || 'free';

  // 1. Basic Auth Check
  if (!authToken) {
    return {
      isAuthenticated: false,
      userId: null,
      userRole: null,
      userPlan: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    };
  }

  // 2. Global Feature Flag Check
  if (featureKey in EVENTOS_CONFIG.ai.features) {
    const isGlobalEnabled = EVENTOS_CONFIG.ai.features[featureKey as keyof typeof EVENTOS_CONFIG.ai.features];
    if (!isGlobalEnabled) {
      return {
        isAuthenticated: true,
        userId,
        userRole,
        userPlan,
        error: NextResponse.json({ error: `AI feature '${featureKey}' is globally disabled` }, { status: 403 })
      };
    }
  }

  // 3. Plan-based Gating
  if (featureKey === 'recommendations' && !canAccessFeature(userPlan, 'aiRecommendations')) {
    return {
      isAuthenticated: true,
      userId,
      userRole,
      userPlan,
      error: NextResponse.json({ error: 'AI Recommendations require a Pro or Enterprise plan' }, { status: 403 })
    };
  }

  return {
    isAuthenticated: true,
    userId,
    userRole,
    userPlan
  };
}

/**
 * Server Action version of AI Auth validation
 */
export async function validateAIAction(
  featureKey: keyof typeof EVENTOS_CONFIG.ai.features | string
) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;
  const userPlan = cookieStore.get('user-plan')?.value || 'free';

  if (!authToken) {
    throw new Error('Authentication required');
  }

  if (featureKey in EVENTOS_CONFIG.ai.features) {
    if (!EVENTOS_CONFIG.ai.features[featureKey as keyof typeof EVENTOS_CONFIG.ai.features]) {
      throw new Error(`AI feature '${featureKey}' is disabled`);
    }
  }

  if (featureKey === 'recommendations' && !canAccessFeature(userPlan, 'aiRecommendations')) {
    throw new Error('This feature requires a Pro or Enterprise plan');
  }

  return {
    userId: cookieStore.get('user-id')?.value,
    userRole: cookieStore.get('user-role')?.value,
    userPlan
  };
}
