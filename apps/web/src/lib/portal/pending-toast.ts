import type { ToastTone } from "@/components/portal/toast";

const KEY = "sso-launcher-pending-toast";

type PendingToast = {
  message: string;
  tone: ToastTone;
};

export function queueToast(message: string, tone: ToastTone = "success") {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ message, tone }));
  } catch {
    return;
  }
}

export function takeToast(): PendingToast | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);

    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(KEY);

    const parsed = JSON.parse(raw) as Partial<PendingToast>;

    if (!parsed.message) {
      return null;
    }

    return { message: parsed.message, tone: parsed.tone ?? "success" };
  } catch {
    return null;
  }
}