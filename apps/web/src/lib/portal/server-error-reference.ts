const FRESH_MS = 5000;

let latest: { reference: string; at: number } | null = null;

export function rememberServerError(reference: string) {
  latest = { reference, at: Date.now() };
}

export function takeServerErrorReference() {
  const current = latest;

  latest = null;

  if (!current || Date.now() - current.at > FRESH_MS) {
    return null;
  }

  return current.reference;
}

export function referenceFromBody(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const value = (body as Record<string, unknown>).referenceId;

  return typeof value === "string" && value.length > 0 ? value : null;
}
