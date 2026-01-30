/**
 * Security Middleware for Firebase Cloud Functions
 * Vibeathon Platform - Enhanced Security Layer
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/v1/https';

const db = admin.firestore();

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  ai_chat: { requests: 50, window: 60 * 1000 }, // 50 AI requests per minute
  qr_generate: { requests: 10, window: 60 * 1000 }, // 10 QR generations per minute
  certificate: { requests: 5, window: 60 * 1000 }, // 5 certificate generations per minute
  whatsapp: { requests: 20, window: 60 * 1000 }, // 20 WhatsApp messages per minute
  scraper: { requests: 100, window: 60 * 60 * 1000 }, // 100 scraper requests per hour
  workspace: { requests: 30, window: 60 * 1000 }, // 30 Google Workspace operations per minute
};

// User role hierarchy
const ROLE_HIERARCHY = {
  student: 0,
  professional: 1,
  speaker: 2,
  moderator: 3,
  organizer: 4,
  admin: 5,
  super_admin: 6
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; window: number }>();

/**
 * Authentication middleware
 */
export const requireAuth = (context: CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  return context.auth.uid;
};

/**
 * Role-based authorization middleware
 */
export const requireRole = async (userId: string, requiredRole: keyof typeof ROLE_HIERARCHY): Promise<void> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const userData = userDoc.data();
    const userRole = userData?.role || 'student';
    
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Insufficient permissions. Required role: ${requiredRole}, current: ${userRole}`
      );
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify user role');
  }
};

/**
 * Rate limiting middleware
 */
export const rateLimit = async (
  userId: string, 
  action: keyof typeof RATE_LIMITS = 'default'
): Promise<void> => {
  const limit = RATE_LIMITS[action];
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit) {
    rateLimitStore.set(key, { count: 1, window: now + limit.window });
    return;
  }
  
  if (now > userLimit.window) {
    // Reset window
    rateLimitStore.set(key, { count: 1, window: now + limit.window });
    return;
  }
  
  if (userLimit.count >= limit.requests) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Rate limit exceeded for ${action}. Try again in ${Math.ceil((userLimit.window - now) / 1000)} seconds.`
    );
  }
  
  userLimit.count++;
  rateLimitStore.set(key, userLimit);
};

/**
 * Input validation middleware
 */
interface FieldRules {
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
}

export const validateInput = (data: Record<string, unknown>, schema: Record<string, FieldRules>): void => {
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const fieldRules = rules;
    
    // Required field check
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Field '${key}' is required`
      );
    }
    
    // Type checking
    if (value !== undefined && fieldRules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== fieldRules.type) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must be of type ${fieldRules.type}, got ${actualType}`
        );
      }
    }
    
    // String validation
    if (fieldRules.type === 'string' && value) {
      if (fieldRules.minLength && value.length < fieldRules.minLength) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must be at least ${fieldRules.minLength} characters long`
        );
      }
      if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must be no more than ${fieldRules.maxLength} characters long`
        );
      }
      if (fieldRules.pattern && !new RegExp(fieldRules.pattern).test(value)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' does not match required pattern`
        );
      }
    }
    
    // Number validation
    if (fieldRules.type === 'number' && value !== undefined) {
      if (fieldRules.min !== undefined && value < fieldRules.min) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must be at least ${fieldRules.min}`
        );
      }
      if (fieldRules.max !== undefined && value > fieldRules.max) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must be no more than ${fieldRules.max}`
        );
      }
    }
    
    // Array validation
    if (fieldRules.type === 'array' && value) {
      if (fieldRules.minItems && value.length < fieldRules.minItems) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must have at least ${fieldRules.minItems} items`
        );
      }
      if (fieldRules.maxItems && value.length > fieldRules.maxItems) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Field '${key}' must have no more than ${fieldRules.maxItems} items`
        );
      }
    }
  }
};

/**
 * Ownership validation middleware
 */
export const requireOwnership = async (
  userId: string,
  collection: string,
  documentId: string,
  ownerField: string = 'ownerId'
): Promise<void> => {
  try {
    const doc = await db.collection(collection).doc(documentId).get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Document not found');
    }
    
    const data = doc.data();
    if (!data || data[ownerField] !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not own this resource'
      );
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify ownership');
  }
};

/**
 * Content filtering middleware
 */
export const filterContent = (content: string): void => {
  const prohibitedWords = [
    // Add prohibited words/patterns here
    'spam', 'phishing', 'malware'
  ];
  
  const lowerContent = content.toLowerCase();
  for (const word of prohibitedWords) {
    if (lowerContent.includes(word)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Content contains prohibited terms'
      );
    }
  }
  
  // Check for potential injection patterns
  const injectionPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(content)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Content contains potentially malicious code'
      );
    }
  }
};

/**
 * Business hours validation
 */
export const requireBusinessHours = (): void => {
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Allow operations 24/7 for global platform
  // Uncomment and modify for business hours restriction:
  // if (hour < 6 || hour > 22) {
  //   throw new functions.https.HttpsError(
  //     'failed-precondition',
  //     'This operation is only available during business hours (6 AM - 10 PM UTC)'
  //   );
  // }
};

/**
 * Feature flag validation
 */
export const requireFeatureFlag = async (featureName: string): Promise<void> => {
  try {
    const featureDoc = await db.collection('systemSettings').doc('featureFlags').get();
    const features = featureDoc.data();
    
    if (!features || !features[featureName]) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Feature '${featureName}' is not enabled`
      );
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to check feature flag');
  }
};

/**
 * Audit logging middleware
 */
export const auditLog = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
): Promise<void> => {
  try {
    await db.collection('auditLogs').add({
      userId,
      action,
      resourceType,
      resourceId,
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: null, // Would need to extract from request in real implementation
      userAgent: null // Would need to extract from request in real implementation
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw error here to avoid breaking main operation
  }
};

/**
 * Security incident logging
 */
export const logSecurityIncident = async (
  type: 'authentication_failure' | 'authorization_failure' | 'rate_limit_exceeded' | 'malicious_content' | 'suspicious_activity',
  userId: string | null,
  details: any
): Promise<void> => {
  try {
    await db.collection('securityIncidents').add({
      type,
      userId,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false
    });
  } catch (error) {
    console.error('Failed to log security incident:', error);
  }
};

/**
 * Comprehensive security wrapper for Cloud Functions
 */
export const secureFunction = (
  options: {
    requireAuth?: boolean;
    requiredRole?: keyof typeof ROLE_HIERARCHY;
    rateLimit?: keyof typeof RATE_LIMITS;
    inputSchema?: any;
    requireOwnership?: { collection: string; documentIdPath: string; ownerField?: string };
    featureFlag?: string;
    requireBusinessHours?: boolean;
    auditAction?: string;
  } = {}
) => {
  return (handler: (data: any, context: CallableContext, userId: string) => Promise<any>) => {
    return async (data: any, context: CallableContext) => {
      let userId: string | null = null;
      
      try {
        // Authentication
        if (options.requireAuth !== false) {
          userId = requireAuth(context);
        }
        
        // Rate limiting
        if (options.rateLimit && userId) {
          await rateLimit(userId, options.rateLimit);
        }
        
        // Input validation
        if (options.inputSchema) {
          validateInput(data, options.inputSchema);
        }
        
        // Role-based authorization
        if (options.requiredRole && userId) {
          await requireRole(userId, options.requiredRole);
        }
        
        // Ownership validation
        if (options.requireOwnership && userId) {
          const documentId = getValueByPath(data, options.requireOwnership.documentIdPath);
          await requireOwnership(
            userId,
            options.requireOwnership.collection,
            documentId,
            options.requireOwnership.ownerField
          );
        }
        
        // Feature flag check
        if (options.featureFlag) {
          await requireFeatureFlag(options.featureFlag);
        }
        
        // Business hours check
        if (options.requireBusinessHours) {
          requireBusinessHours();
        }
        
        // Execute the handler
        const result = await handler(data, context, userId!);
        
        // Audit logging
        if (options.auditAction && userId) {
          await auditLog(
            userId,
            options.auditAction,
            'function_call',
            context.rawRequest.url || 'unknown',
            { data: sanitizeForLog(data) }
          );
        }
        
        return result;
        
      } catch (error) {
        // Log security incidents
        if (error instanceof functions.https.HttpsError) {
          if (error.code === 'unauthenticated' || error.code === 'permission-denied') {
            await logSecurityIncident(
              error.code === 'unauthenticated' ? 'authentication_failure' : 'authorization_failure',
              userId,
              { error: error.message, functionName: handler.name }
            );
          } else if (error.code === 'resource-exhausted') {
            await logSecurityIncident('rate_limit_exceeded', userId, { error: error.message });
          }
        }
        
        throw error;
      }
    };
  };
};

/**
 * Helper function to get value by dot notation path
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
}

/**
 * Helper function to sanitize data for logging
 */
function sanitizeForLog(data: any): any {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'phone', 'email'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Export validation schemas for common use cases
export const ValidationSchemas = {
  createNotation: {
    title: { required: true, type: 'string', maxLength: 200 },
    content: { required: true, type: 'string', maxLength: 50000 },
    eventId: { required: false, type: 'string' },
    tags: { required: false, type: 'array', maxItems: 10 },
    visibility: { required: true, type: 'string', pattern: '^(public|private|event)$' }
  },
  
  createWorkflow: {
    name: { required: true, type: 'string', minLength: 3, maxLength: 100 },
    description: { required: false, type: 'string', maxLength: 500 },
    triggerType: { required: true, type: 'string' },
    actions: { required: true, type: 'array', minItems: 1, maxItems: 10 }
  },
  
  generateCertificate: {
    templateId: { required: true, type: 'string' },
    recipientUserId: { required: true, type: 'string' },
    eventId: { required: false, type: 'string' },
    customFields: { required: false, type: 'object' }
  },
  
  sendWhatsAppMessage: {
    phoneNumber: { required: true, type: 'string', pattern: '^\\+[1-9]\\d{1,14}$' },
    message: { required: true, type: 'string', minLength: 1, maxLength: 1000 },
    templateId: { required: false, type: 'string' }
  },
  
  createGoogleDocument: {
    eventId: { required: true, type: 'string' },
    template: { required: true, type: 'object' }
  },
  
  aiChat: {
    message: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
    sessionId: { required: false, type: 'string' },
    context: { required: false, type: 'object' }
  }
};