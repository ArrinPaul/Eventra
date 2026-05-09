import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = (token.role as string) || "attendee";
        // @ts-ignore
        session.user.onboardingCompleted = !!token.onboardingCompleted;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      if (trigger === "update" && session) {
        token.onboardingCompleted = session.onboardingCompleted;
        token.role = session.role;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
} satisfies NextAuthConfig;
