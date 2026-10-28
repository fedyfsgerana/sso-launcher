"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { currentPath, loginPathFor } from "@/lib/portal/safe-path";
import { markSessionActive } from "@/lib/portal/session-expiry";
import type { AuthSession, AuthUser } from "@/types/auth";

type AuthSessionContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type AuthSessionProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getSession()
      .then((value) => {
        if (!active) {
          return;
        }

        markSessionActive();
        setSession(value);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        router.replace(loginPathFor(currentPath()));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  const user = useMemo<AuthUser | null>(() => {
    if (!session) {
      return null;
    }

    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      department: session.department,
      departemenCode: session.departemenCode,
      jobTitle: session.jobTitle,
    };
  }, [session]);

  return (
    <AuthSessionContext.Provider
      value={{
        session,
        user,
        loading,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }

  return context;
}
