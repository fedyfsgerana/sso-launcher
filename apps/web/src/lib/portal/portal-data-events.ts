export const PORTAL_DATA_CHANGED_EVENT = "sso:portal-data-changed";

export function notifyPortalDataChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PORTAL_DATA_CHANGED_EVENT));
}
