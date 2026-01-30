import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * API Rate Limiting Middleware
 * Provides protection against abuse and DDoS attacks
 */

// ============================================================
// TYPES
// ============================================================

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Message to return when rate limited */
  message?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (req: NextRequest) => boolean;
  /** Key generator for identifying unique clients */
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ============================================================
// IN-MEMORY STORE (For single-instance deployments)
// ============================================================

// Note: For production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================================
// DEFAULT CONFIGURATIONS
// ============================================================

export const rateLimitConfigs = {
  /** Standard API rate limit */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests, please try again later.',
  },
  
  /** Strict limit for sensitive endpoints */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please wait before trying again.',
  },
  
  /** Auth endpoints (login, signup) */
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many authentication attempts. Please try again in a minute.',
  },
  
  /** Search endpoints */
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many search requests. Please slow down.',
  },
  
  /** File upload endpoints */
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many upload attempts. Please wait before uploading more files.',
  },
  
  /** AI/LLM endpoints */
  ai: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'AI request limit reached. Please wait before making more AI requests.',
  },
  
  /** Webhook endpoints */
  webhook: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Webhook rate limit exceeded.',
  },
  
  /** Public API */
  publicApi: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'API rate limit exceeded. Please check our documentation for rate limits.',
  },
} as const;

// ============================================================
// RATE LIMITER FUNCTION
// ============================================================

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }
  
  // Increment count
  entry.count += 1;
  
  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// ============================================================
// KEY GENERATORS
// ============================================================

export function getClientIP(req: NextRequest): string {
  // Check various headers for real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to request IP or generic key
  return 'unknown-ip';
}

export function generateRateLimitKey(req: NextRequest, prefix: string = 'rl'): string {
  const ip = getClientIP(req);
  const path = new URL(req.url).pathname;
  return `${prefix}:${ip}:${path}`;
}

export function generateUserRateLimitKey(userId: string, endpoint: string): string {
  return `rl:user:${userId}:${endpoint}`;
}

// ============================================================
// MIDDLEWARE HELPER
// ============================================================

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return function rateLimitMiddleware(req: NextRequest) {
    // Check skip condition
    if (config.skip?.(req)) {
      return null; // Skip rate limiting
    }
    
    // Generate key
    const key = config.keyGenerator?.(req) || generateRateLimitKey(req);
    
    // Check rate limit
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }
    
    // Return null to indicate request should proceed
    // Headers will be added separately
    return null;
  };
}

// ============================================================
// RATE LIMIT HEADERS
// ============================================================

export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  key: string
): NextResponse {
  const result = checkRateLimit(key, config);
  
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  
  return response;
}

// ============================================================
// ENDPOINT-SPECIFIC RATE LIMITERS
// ============================================================

export const rateLimiters = {
  /** Rate limit for standard API endpoints */
  standard: createRateLimitMiddleware(rateLimitConfigs.standard),
  
  /** Rate limit for auth endpoints (login, signup, password reset) */
  auth: createRateLimitMiddleware(rateLimitConfigs.auth),
  
  /** Rate limit for search endpoints */
  search: createRateLimitMiddleware(rateLimitConfigs.search),
  
  /** Rate limit for file upload endpoints */
  upload: createRateLimitMiddleware(rateLimitConfigs.upload),
  
  /** Rate limit for AI/LLM endpoints */
  ai: createRateLimitMiddleware(rateLimitConfigs.ai),
  
  /** Rate limit for webhook endpoints */
  webhook: createRateLimitMiddleware(rateLimitConfigs.webhook),
  
  /** Rate limit for public API */
  publicApi: createRateLimitMiddleware(rateLimitConfigs.publicApi),
};

// ============================================================
// API ROUTE WRAPPER
// ============================================================

export function withRateLimit<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  config: RateLimitConfig = rateLimitConfigs.standard
) {
  return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse<T | { error: string; retryAfter: number }>> {
    // Check skip condition
    if (config.skip?.(req)) {
      return handler(req);
    }
    
    // Generate key
    const key = config.keyGenerator?.(req) || generateRateLimitKey(req);
    
    // Check rate limit
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      ) as NextResponse<{ error: string; retryAfter: number }>;
    }
    
    // Call the handler
    const response = await handler(req);
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}

// ============================================================
// SLIDING WINDOW RATE LIMITER (More precise)
// ============================================================

interface SlidingWindowEntry {
  timestamps: number[];
}

const slidingWindowStore = new Map<string, SlidingWindowEntry>();

export function checkSlidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  let entry = slidingWindowStore.get(key);
  
  if (!entry) {
    entry = { timestamps: [] };
    slidingWindowStore.set(key, entry);
  }
  
  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);
  
  // Check if over limit
  if (entry.timestamps.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
    };
  }
  
  // Add current timestamp
  entry.timestamps.push(now);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  checkRateLimit,
  createRateLimitMiddleware,
  addRateLimitHeaders,
  withRateLimit,
  checkSlidingWindowRateLimit,
  rateLimiters,
  rateLimitConfigs,
  getClientIP,
  generateRateLimitKey,
  generateUserRateLimitKey,
};
