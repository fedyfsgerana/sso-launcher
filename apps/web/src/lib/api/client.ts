import { notifyPortalDataChanged } from "@/lib/portal/portal-data-events";
import {
  referenceFromBody,
  rememberServerError,
} from "@/lib/portal/server-error-reference";
import { handleSessionExpired } from "@/lib/portal/session-expiry";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;

  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();

    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return null;
}

function getCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const candidates = [
    "sso_launcher_csrf",
    "sso-launcher-csrf",
    "csrf",
    "csrf_token",
    "XSRF-TOKEN",
  ];

  for (const name of candidates) {
    const token = getCookie(name);

    if (token) {
      return token;
    }
  }

  for (const part of document.cookie.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const name = decodeURIComponent(part.slice(0, separatorIndex).trim());

    if (!/csrf|xsrf/i.test(name)) {
      continue;
    }

    const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());

    if (value) {
      return value;
    }
  }

  return null;
}

export function withReason(path: string, reason: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}reason=${encodeURIComponent(reason)}`;
}

const SESSION_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/sso/sign-out",
]);

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly reference: string | null;

  constructor(status: number, body: unknown = null) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.reference = referenceFromBody(body);
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!SAFE_METHODS.has(method)) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && !SESSION_EXEMPT_PATHS.has(path)) {
      handleSessionExpired();
    }

    const error = new ApiError(response.status, await readErrorBody(response));

    if (error.reference) {
      rememberServerError(error.reference);
    }

    throw error;
  }

  if (!SAFE_METHODS.has(method) && path.startsWith("/api/admin/")) {
    notifyPortalDataChanged();
  }

  return response;
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await send(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
