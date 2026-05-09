import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isOrganizerRoute = nextUrl.pathname.startsWith("/organizer");
  const isProtectedRoute = isAdminRoute || isOrganizerRoute || 
                          nextUrl.pathname.startsWith("/profile") || 
                          nextUrl.pathname.startsWith("/networking") ||
                          nextUrl.pathname.startsWith("/ticketing") ||
                          nextUrl.pathname.startsWith("/my-events");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    const userRole = (req.auth?.user as any)?.role;
    const onboardingCompleted = (req.auth?.user as any)?.onboardingCompleted;

    // Force onboarding if not completed (except for onboarding page itself and logout)
    if (!onboardingCompleted && nextUrl.pathname !== "/onboarding" && !nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }

    // Role-based protection
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    if (isOrganizerRoute && userRole !== "organizer" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public|sw.js).*)"],
};
