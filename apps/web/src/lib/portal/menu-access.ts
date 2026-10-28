import type { PortalMenuItem } from "@/types/portal";

function normalize(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export function hasMenu(menus: PortalMenuItem[], target: string): boolean {
  const wanted = normalize(target);

  return menus.some(
    (menu) =>
      menu.targetType === "page" && normalize(menu.targetValue) === wanted,
  );
}

export function canOpenPath(
  menus: PortalMenuItem[],
  pathname: string,
): boolean {
  const segment = normalize(pathname).split("/")[0] ?? "";

  return hasMenu(menus, segment);
}

export type MenuMaintenance = {
  title: string;
  message: string;
};

export function maintenanceFor(
  menus: PortalMenuItem[],
  pathname: string,
): MenuMaintenance | null {
  const wanted = normalize(pathname).split("/")[0] ?? "";

  const menu = menus.find(
    (item) =>
      item.targetType === "page" && normalize(item.targetValue) === wanted,
  );

  if (!menu) {
    return null;
  }

  const byId = new Map(menus.map((item) => [item.id, item]));
  let current: PortalMenuItem | undefined = menu;

  while (current) {
    if (current.maintenanceActive) {
      return {
        title: current.maintenanceTitle ?? "Halaman sedang dalam perbaikan",
        message:
          current.maintenanceMessage ??
          "Halaman ini sementara tidak bisa dibuka. Silakan coba lagi nanti.",
      };
    }

    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return null;
}
