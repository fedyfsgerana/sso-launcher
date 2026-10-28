import { queueToast } from "@/lib/portal/pending-toast";
import { currentPath, loginPathFor } from "@/lib/portal/safe-path";

const ACTIVE_KEY = "sso-launcher-session-active";
const EXPIRED_MESSAGE = "Sesi Anda telah berakhir. Silakan masuk kembali.";
const LOGIN_PATH = "/login";

export function markSessionActive() {
  try {
    window.sessionStorage.setItem(ACTIVE_KEY, "1");
  } catch {
    return;
  }
}

export function clearSessionActive() {
  try {
    window.sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    return;
  }
}

export function handleSessionExpired() {
  if (typeof window === "undefined") {
    return;
  }

  let wasActive = false;

  try {
    wasActive = window.sessionStorage.getItem(ACTIVE_KEY) === "1";
  } catch {
    wasActive = false;
  }

  clearSessionActive();

  if (window.location.pathname.startsWith(LOGIN_PATH)) {
    return;
  }

  if (wasActive) {
    queueToast(EXPIRED_MESSAGE, "warning");
  }

  window.location.replace(loginPathFor(currentPath()));
}