const STORAGE_KEY = "sso-signed-out-apps";

function read(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    if (slugs.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    return;
  }
}

export function markSignedOut(slug: string) {
  const slugs = read();

  if (!slugs.includes(slug)) {
    write([...slugs, slug]);
  }
}

export function clearSignedOut(slug: string) {
  write(read().filter((item) => item !== slug));
}

export function isSignedOut(slug: string) {
  return read().includes(slug);
}
