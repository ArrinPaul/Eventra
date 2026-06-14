import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/', 
  '/explore', 
  '/login(.*)', 
  '/register(.*)',
  '/api/webhooks/clerk(.*)',
  '/maintenance'
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // 1. Authentication check
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // 2. Optional: Maintenance Mode check (Implementation depends on where you store the flag)
  // For a basic implementation, we check for a custom header or env var, 
  // but for the DB-driven toggle we'd need an Edge-compatible way to read settings.
  // Since we're using Drizzle/Postgres, reading from Edge middleware is possible if using a pooled connection.
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
