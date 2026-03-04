import "next-auth";
import "next-auth/jwt";

import type { UserId } from "@/types/branded";

declare module "next-auth" {
  interface Session {
    user: {
      id: UserId;
      name: string;
      image: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
