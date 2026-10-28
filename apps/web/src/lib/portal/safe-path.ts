const DEFAULT_PATH = "/overview";
const LOGIN_PATH = "/login";

export function safeNextPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return DEFAULT_PATH;
  }

  if (
    value === LOGIN_PATH ||
    value.startsWith(`${LOGIN_PATH}?`) ||
    value.startsWith(`${LOGIN_PATH}/`)
  ) {
    return DEFAULT_PATH;
  }

  return value;
}

export function loginPathFor(currentPath: string): string {
  const next = safeNextPath(currentPath);

  return next === DEFAULT_PATH
    ? LOGIN_PATH
    : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

export function currentPath(): string {
  if (typeof window === "undefined") {
    return DEFAULT_PATH;
  }

  return `${window.location.pathname}${window.location.search}`;
}
