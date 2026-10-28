import type { AuthSession, LoginRequest } from "@/types/auth";

export type LoginResult = AuthSession;

export type LoginCredentials = LoginRequest;

export type AuthState = {
  session: AuthSession | null;
  loading: boolean;
};
