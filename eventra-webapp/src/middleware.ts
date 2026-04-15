import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes and the roles required to access them
const roleRequirements: Record<string, string[]> = {
  "/admin": ["admin"],
  "/organizer": ["admin", "organizer"],
  "/events/create": ["admin", "organizer"],
};

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 1. Check if the current path requires a specific role
  const requiredRoles = Object.entries(roleRequirements).find(([path]) => 
    pathname.startsWith(path)
  )?.[1];

  if (requiredRoles) {
    // If no session, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If user has the wrong role, redirect to home or unauthorized
    const userRole = session.user.role;
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Auth Page Protection: If logged in, don't show login/signup pages
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Ensure middleware only runs on relevant routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|sw.js).*)"
  ],
};
