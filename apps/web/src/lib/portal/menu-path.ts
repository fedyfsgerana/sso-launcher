import type { PortalMenuItem } from "@/types/portal";

function normalizeInternalPath(value: string) {
  const path = value.trim();

  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function menuHref(menu: PortalMenuItem): string {
  if (menu.targetType === "url") {
    return menu.targetValue;
  }

  return normalizeInternalPath(menu.targetValue);
}

function matchesPath(href: string, pathname: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function isMenuActive(menu: PortalMenuItem, pathname: string): boolean {
  if (menu.targetType === "url") {
    return false;
  }

  return matchesPath(menuHref(menu), pathname);
}
