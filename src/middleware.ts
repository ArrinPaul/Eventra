/**
 * EventOS Middleware
 * Handles route protection and role-based redirects
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route access configurations
const ROUTE_CONFIG = {
  // Public routes - accessible without authentication
  public: [
    '/',
    '/login',
    '/register',
    '/explore',
    '/events', // Event listing is public
  ],
  
  // Auth routes - redirect to dashboard if already logged in
  auth: [
    '/login',
    '/register',
  ],
  
  // Protected routes by role
  protected: {
    // Admin-only routes
    admin: [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/admin/analytics',
    ],
    
    // Organizer routes (organizers and admins)
    organizer: [
      '/organizer',
      '/organizer/events',
      '/organizer/analytics',
      '/check-in-scanner',
    ],
    
    // Authenticated user routes (any logged-in user)
    authenticated: [
      '/my-events',
      '/preferences',
      '/ticketing',
      '/chat',
      '/networking',
      '/matchmaking',
      '/groups',
      '/community',
      '/feed',
      '/gamification',
      '/leaderboard',
      '/calendar',
      '/agenda',
      '/ai-recommendations',
    ],
  },
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  organizer: 50,
  moderator: 40,
  speaker: 30,
  vendor: 25,
  sponsor: 20,
  volunteer: 15,
  media: 10,
  attendee: 5,
};

/**
 * Check if a path matches any pattern in the list
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Exact match
    if (pathname === pattern) return true;
    // Prefix match for nested routes
    if (pathname.startsWith(pattern + '/')) return true;
    return false;
  });
}

/**
 * Get required role level for a path
 */
function getRequiredRoleLevel(pathname: string): number | null {
  if (matchesPath(pathname, ROUTE_CONFIG.protected.admin)) {
    return ROLE_HIERARCHY.admin;
  }
  if (matchesPath(pathname, ROUTE_CONFIG.protected.organizer)) {
    return ROLE_HIERARCHY.organizer;
  }
  if (matchesPath(pathname, ROUTE_CONFIG.protected.authenticated)) {
    return ROLE_HIERARCHY.attendee;
  }
  return null; // Public route
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  
  const isAuthenticated = !!authToken;
  const currentRoleLevel = userRole ? (ROLE_HIERARCHY[userRole] || 0) : 0;

  // Check if this is an auth route (login/register)
  if (matchesPath(pathname, ROUTE_CONFIG.auth)) {
    // If already authenticated, redirect to appropriate dashboard
    if (isAuthenticated) {
      if (currentRoleLevel >= ROLE_HIERARCHY.organizer) {
        return NextResponse.redirect(new URL('/organizer', request.url));
      }
      return NextResponse.redirect(new URL('/explore', request.url));
    }
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiredLevel = getRequiredRoleLevel(pathname);
  
  if (requiredLevel !== null) {
    // Route requires authentication
    if (!isAuthenticated) {
      // Store the intended destination for redirect after login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role-based access
    if (currentRoleLevel < requiredLevel) {
      // User doesn't have sufficient permissions
      // Redirect to their appropriate page
      if (currentRoleLevel >= ROLE_HIERARCHY.organizer) {
        return NextResponse.redirect(new URL('/organizer', request.url));
      }
      return NextResponse.redirect(new URL('/explore', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
