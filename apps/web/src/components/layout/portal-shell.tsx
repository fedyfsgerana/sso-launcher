"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CornerDownRight } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ConfirmProvider } from "@/components/portal/confirm-provider";
import { PendingToast } from "@/components/portal/pending-toast";
import { RouteProgress } from "@/components/portal/route-progress";
import { MenuGuard } from "@/components/portal/menu-guard";
import { ScrollTop } from "@/components/portal/scroll-top";
import { ToastProvider } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { AuthSessionProvider } from "@/features/auth/auth-session-provider";
import {
  PortalDataProvider,
  usePortalData,
} from "@/features/portal/portal-data-provider";
import { isMenuActive, menuHref } from "@/lib/portal/menu-path";
import type { PortalMenuItem } from "@/types/portal";
import { resolveIcon } from "@/lib/icons";
import { useMediaQuery } from "@/lib/portal/use-media-query";

const LOOSE_HEADER: PortalMenuItem = {
  id: "__loose",
  parentId: null,
  label: "Lainnya",
  icon: "",
  targetType: "section",
  targetValue: "",
  sortOrder: Number.MAX_SAFE_INTEGER,
  maintenanceActive: false,
  maintenanceTitle: null,
  maintenanceMessage: null,
  actions: [],
};

type PortalShellProps = Readonly<{
  children: ReactNode;
}>;

function ShellBody({ children }: PortalShellProps) {
  const pathname = usePathname();
  const { menus } = usePortalData();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const forced = useMediaQuery("(max-width:1024px) and (min-width:681px)");

  const isCollapsed = forced || collapsed;

  useEffect(() => {
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => setReady(true));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);
  const hasChildren = new Set(
    menus.filter((menu) => menu.parentId).map((menu) => menu.parentId),
  );

  function childrenOf(parentId: string | null) {
    const children = menus
      .filter((item) => item.parentId === parentId)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    return parentId === null
      ? [
          ...children.filter((item) => item.targetType === "section"),
          ...children.filter((item) => item.targetType !== "section"),
        ]
      : children;
  }

  const leaves: PortalMenuItem[] = [];

  function collectLeaves(parentId: string | null) {
    for (const menu of childrenOf(parentId)) {
      if (hasChildren.has(menu.id)) {
        collectLeaves(menu.id);
      } else if (menu.targetType !== "section") {
        leaves.push(menu);
      }
    }
  }

  collectLeaves(null);

  const quickMenus = leaves.slice(0, 3);
  const quickIds = new Set(quickMenus.map((menu) => menu.id));

  function hasSheetItem(menu: PortalMenuItem): boolean {
    if (!hasChildren.has(menu.id)) {
      return menu.targetType !== "section" && !quickIds.has(menu.id);
    }

    return childrenOf(menu.id).some(hasSheetItem);
  }

  const sheetMenus: Array<{ menu: PortalMenuItem; depth: number }> = [];

  function collectSheetMenus(parentId: string | null, depth: number) {
    let looseHeader = false;

    for (const menu of childrenOf(parentId)) {
      if (!hasSheetItem(menu)) {
        continue;
      }

      if (parentId === null && menu.targetType !== "section" && !looseHeader) {
        looseHeader = true;
        sheetMenus.push({ menu: LOOSE_HEADER, depth: 0 });
      }

      sheetMenus.push({ menu, depth });
      collectSheetMenus(
        menu.id,
        menu.targetType === "section" ? depth : depth + 1,
      );
    }
  }

  collectSheetMenus(null, 0);

  return (
    <div
      className={[
        "shell",
        isCollapsed ? "is-collapsed" : "",
        ready ? "is-ready" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id="shell"
    >
      <Sidebar
        collapsed={isCollapsed}
        width={isCollapsed ? null : sidebarWidth}
        onResize={setSidebarWidth}
        onToggle={() => {
          setSidebarWidth(null);
          setCollapsed((value) => !value);
        }}
      />

      <main className="main">
        <Topbar />
        <MenuGuard>{children}</MenuGuard>
      </main>

      <ScrollTop hidden={sheetOpen} />

      <BottomNav
        menus={quickMenus}
        moreMenus={sheetMenus
          .map(({ menu }) => menu)
          .filter((menu) => menu.targetType !== "section")}
        sheetOpen={sheetOpen}
        onMore={() => setSheetOpen((value) => !value)}
      />

      <div
        className={sheetOpen ? "sheet-bg show" : "sheet-bg"}
        onClick={() => setSheetOpen(false)}
      />

      <div className={sheetOpen ? "sheet show" : "sheet"}>
        <div className="grab" />

        <div className="sheet-scroll">
          {sheetMenus.map(({ menu, depth }) =>
            menu.id === LOOSE_HEADER.id || hasChildren.has(menu.id) ? (
              <div
                key={menu.id}
                className="sheet-group"
                style={{ paddingLeft: depth * 16 }}
              >
                {menu.icon ? <Icon icon={resolveIcon(menu.icon)} /> : null}
                <span>{menu.label}</span>
              </div>
            ) : (
              <Link
                key={menu.id}
                className={`${isMenuActive(menu, pathname) ? "nav active" : "nav"}${depth > 0 ? " sub" : ""}`}
                href={menuHref(menu)}
                style={{ paddingLeft: depth > 0 ? 14 + depth * 16 : undefined }}
                onClick={() => setSheetOpen(false)}
              >
                {depth > 0 ? (
                  <Icon icon={CornerDownRight} size={15} />
                ) : menu.icon ? (
                  <Icon icon={resolveIcon(menu.icon)} />
                ) : null}
                <span>{menu.label}</span>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function PortalShell({ children }: PortalShellProps) {
  return (
    <AuthSessionProvider>
      <PortalDataProvider>
        <ToastProvider>
          <ConfirmProvider>
            <PendingToast />
            <RouteProgress />
            <ShellBody>{children}</ShellBody>
          </ConfirmProvider>
        </ToastProvider>
      </PortalDataProvider>
    </AuthSessionProvider>
  );
}
