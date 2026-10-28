"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPortalMenus,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";

export function useAdminMenus() {
  const [menus, setMenus] = useState<AdminPortalMenu[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const list = await getPortalMenus().catch(() => [] as AdminPortalMenu[]);

    setMenus(list);
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const list = await getPortalMenus().catch(() => [] as AdminPortalMenu[]);

      if (active) {
        setMenus(list);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { menus, setMenus, reload, loading };
}
