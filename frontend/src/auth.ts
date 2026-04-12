import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { DefaultSession } from 'next-auth';
import type { UserRole } from './types';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-client-id-for-dev',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret-for-dev',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // In a real database, you'd fetch the user role from DB here based on user.email or user.id.
        // Defaulting to attendee for now until DB is wired.
        token.role = 'attendee';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', // Optional: Custom login page route
  },
});
