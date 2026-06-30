import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/', 
  '/explore', 
  '/login(.*)', 
  '/register(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/webhooks/dodo(.*)',
  '/api/health',
  '/maintenance'
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // In Clerk v7, protect() lives on the auth function itself.
    // It checks authentication AND returns the signed-in auth object.
    const authObj = await auth.protect();

    // Role-based protection for admin routes
    if (isAdminRoute(request)) {
      const role = (authObj.sessionClaims?.metadata as { role?: string })?.role ||
                   (authObj.sessionClaims?.publicMetadata as { role?: string })?.role;
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

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
