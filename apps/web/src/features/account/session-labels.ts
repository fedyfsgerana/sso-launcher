import type { AccountSession } from "@/features/account/api";
import { formatRelative } from "@/lib/portal/format";

const LOCAL_ADDRESSES = new Set(["::1", "127.0.0.1", "::ffff:127.0.0.1"]);
const MOBILE_SYSTEMS = /android|ios|iphone|ipad/i;

export function describeSession(session: AccountSession) {
  const browser = [session.browser, session.browserVersion?.split(".")[0]]
    .filter(Boolean)
    .join(" ");

  return (
    [browser, session.operatingSystem].filter(Boolean).join(" · ") ||
    "Perangkat tidak dikenal"
  );
}

export function describeAddress(ipAddress: string | null) {
  if (!ipAddress) {
    return null;
  }

  return LOCAL_ADDRESSES.has(ipAddress) ? "Komputer ini (lokal)" : ipAddress;
}

export function describeLocation(session: AccountSession) {
  return [
    session.deviceName,
    describeAddress(session.ipAddress),
    `aktif ${formatRelative(session.lastSeenAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function isMobileSession(session: AccountSession) {
  return MOBILE_SYSTEMS.test(session.operatingSystem ?? "");
}
