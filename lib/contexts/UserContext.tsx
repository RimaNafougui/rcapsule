"use client";
import type { User } from "@/lib/database.type";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as Sentry from "@sentry/nextjs";

import { apiFetch } from "@/types/api-response";

interface UserContextType {
  user: User | null;
  refreshUser: () => void;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  refreshUser: () => {},
  loading: true,
  isPremium: false,
  isAdmin: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setUser(null);
      Sentry.setUser(null);
      setLoading(false);

      return;
    }

    // apiFetch<User> returns ApiResponse<User>; we narrow on `.ok` before
    // touching `.data`, so there is no implicit `any` cast.
    const result = await apiFetch<User>("/api/user/me");

    if (result.ok) {
      setUser(result.data);
      Sentry.setUser({
        id: result.data.id,
        email: result.data.email,
        username: result.data.name,
      });
    } else {
      // Fallback with default free status on error or auth failure
      console.error("Error fetching user:", result.error);
      setUser({
        ...session.user,
        subscription_status: "free",
      } as unknown as User);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [status, session?.user?.id]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchUser();
    };

    window.addEventListener("refreshUser", handleRefresh);

    return () => window.removeEventListener("refreshUser", handleRefresh);
  }, [status, session?.user?.id]);

  const isPremium = user?.subscription_status === "premium";
  const isAdmin = user?.role === "admin";

  return (
    <UserContext.Provider
      value={{ user, refreshUser: fetchUser, loading, isPremium, isAdmin }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
