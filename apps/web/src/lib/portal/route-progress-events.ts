export const ROUTE_PROGRESS_EVENT = "sso:route-progress";

export function startRouteProgress(href: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<string>(ROUTE_PROGRESS_EVENT, { detail: href }),
  );
}
