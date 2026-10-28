export const REQUIRED_MESSAGE = "Wajib diisi";

export function requireText(value: string, message = REQUIRED_MESSAGE) {
  return value.trim() ? undefined : message;
}

export const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function requireEmail(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return REQUIRED_MESSAGE;
  }

  if (trimmed.length > 254) {
    return "Email maksimal 254 karakter";
  }

  return EMAIL_PATTERN.test(trimmed) ? undefined : "Format email tidak valid";
}

export function requireUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return REQUIRED_MESSAGE;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return "URL harus diawali http:// atau https://";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "URL harus diawali http:// atau https://";
  }

  return url.username || url.password
    ? "URL tidak boleh berisi nama pengguna atau password"
    : undefined;
}

export function requireLaunchUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return REQUIRED_MESSAGE;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return "URL tidak valid";
  }

  if (url.username || url.password) {
    return "URL tidak boleh berisi nama pengguna atau password";
  }

  if (url.protocol === "https:") {
    return undefined;
  }

  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  return url.protocol === "http:" && loopback
    ? undefined
    : "URL harus diawali https://. Alamat http:// hanya boleh untuk localhost";
}

export function requireAppUrl(value: string) {
  const error = requireLaunchUrl(value);

  if (error) {
    return error;
  }

  const url = new URL(value.trim());

  return url.search || url.hash
    ? "Alamat aplikasi tidak boleh berisi ? atau #"
    : undefined;
}

export const DEFAULT_CALLBACK_PATH = "/sso/callback";

export function requireCallbackPath(value: string) {
  const path = value.trim();

  if (!path) {
    return REQUIRED_MESSAGE;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.length < 2) {
    return "Path harus diawali satu tanda /, misalnya /sso/callback";
  }

  return /[?#\\\s]/.test(path)
    ? "Path tidak boleh berisi spasi, ?, #, atau garis miring terbalik"
    : undefined;
}

export function callbackUrl(appUrl: string, path: string) {
  return `${appUrl.trim().replace(/\/+$/, "")}${path.trim()}`;
}

export function firstError(errors: Record<string, string | undefined>) {
  return Object.values(errors).find(Boolean);
}
