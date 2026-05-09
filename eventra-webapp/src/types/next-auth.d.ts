import { DefaultSession } from "next-auth";
import { UserRole } from "./index";

declare module "next-auth" {
  interface User {
    role: UserRole;
    onboardingCompleted: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    onboardingCompleted: boolean;
  }
}
