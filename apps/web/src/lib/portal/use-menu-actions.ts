"use client";

import { usePortalData } from "@/features/portal/portal-data-provider";

function normalize(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export function useMenuActions(menuTarget: string) {
  const { menus } = usePortalData();
  const wanted = normalize(menuTarget);

  const granted = menus
    .filter(
      (menu) =>
        menu.targetType === "page" && normalize(menu.targetValue) === wanted,
    )
    .flatMap((menu) => menu.actions);

  return {
    can: (actionKey: string) => granted.includes(actionKey),
    actions: granted,
  };
}
