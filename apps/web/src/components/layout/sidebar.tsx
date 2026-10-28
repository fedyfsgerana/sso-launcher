"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, SquareArrowOutUpRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import brandLogo from "@/assets/brand/logo.webp";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { isMenuActive, menuHref } from "@/lib/portal/menu-path";
import type { PortalMenuItem } from "@/types/portal";
import { resolveIcon } from "@/lib/icons";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { APP_VERSION } from "@/lib/portal/version";

type TipState = {
  label: string;
  top: number;
  left: number;
};

type SidebarProps = Readonly<{
  collapsed: boolean;
  width: number | null;
  onResize: (width: number | null) => void;
  onToggle: () => void;
}>;

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 420;

export function Sidebar({
  collapsed,
  width,
  onResize,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { menus, loading } = usePortalData();
  const [tip, setTip] = useState<TipState | null>(null);
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [resizing, setResizing] = useState(false);
  const resizeStart = useRef<{ x: number; width: number } | null>(null);

  const roots = useMemo(
    () =>
      menus
        .filter((menu) => menu.parentId === null)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [menus],
  );
  const showSkeleton = useMinLoading(loading && roots.length === 0);
  const sectionRoots = roots.filter((menu) => menu.targetType === "section");
  const looseRoots = roots.filter((menu) => menu.targetType !== "section");

  const childrenByParent = useMemo(() => {
    const map = new Map<string, typeof menus>();

    for (const menu of menus) {
      if (!menu.parentId) {
        continue;
      }

      const children = map.get(menu.parentId) ?? [];
      children.push(menu);
      map.set(menu.parentId, children);
    }

    for (const children of map.values()) {
      children.sort((left, right) => left.sortOrder - right.sortOrder);
    }

    return map;
  }, [menus]);

  function hasActiveDescendant(menuId: string): boolean {
    return (childrenByParent.get(menuId) ?? []).some(
      (child) => isMenuActive(child, pathname) || hasActiveDescendant(child.id),
    );
  }

  function toggle(menuId: string, open: boolean) {
    setExpanded((current) => {
      const next = new Map(current);

      next.set(menuId, !open);

      return next;
    });
  }

  function renderMenu(menu: PortalMenuItem, depth: number) {
    const children = childrenByParent.get(menu.id) ?? [];

    if (menu.targetType === "section") {
      if (children.length === 0) {
        return null;
      }

      return (
        <div className="sb-section" key={menu.id}>
          <span className="sb-section-title" aria-hidden={collapsed}>
            {menu.label}
          </span>
          {children.map((child) => renderMenu(child, depth))}
        </div>
      );
    }

    const active = isMenuActive(menu, pathname);
    const branchActive = hasActiveDescendant(menu.id);
    const external = menu.targetType === "url";
    const open = expanded.get(menu.id) ?? branchActive;
    const shown = open && !collapsed;

    const classes = [
      "nav",
      depth > 0 ? "sub" : "",
      active || (collapsed && branchActive)
        ? "active"
        : branchActive
          ? "branch-active"
          : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (children.length > 0) {
      return (
        <div className="sb-tree" key={menu.id}>
          <div className="sb-parent-row">
            <button
              className={classes}
              type="button"
              aria-expanded={shown}
              aria-label={`${shown ? "Tutup" : "Buka"} submenu ${menu.label}`}
              data-label={menu.label}
              onMouseEnter={(event) =>
                showTip(
                  event,
                  branchActive && collapsed
                    ? `${menu.label} — submenu aktif`
                    : menu.label,
                )
              }
              onClick={() => toggle(menu.id, open)}
            >
              {menu.icon ? <Icon icon={resolveIcon(menu.icon)} /> : null}
              <span>{menu.label}</span>

              <em className={open ? "sb-caret open" : "sb-caret"}>
                <Icon icon={ChevronDown} size={15} />
              </em>
            </button>
          </div>

          <div
            className={shown ? "sb-submenu-wrap open" : "sb-submenu-wrap"}
            inert={!shown}
          >
            <div className="sb-submenu">
              {children.map((child) => renderMenu(child, depth + 1))}
            </div>
          </div>
        </div>
      );
    }

    const link = (
      <Link
        key={menu.id}
        className={classes}
        href={menuHref(menu)}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        aria-current={active ? "page" : undefined}
        data-label={menu.label}
        onMouseEnter={(event) => showTip(event, menu.label)}
      >
        {menu.icon ? <Icon icon={resolveIcon(menu.icon)} /> : null}
        <span>{menu.label}</span>

        {external ? (
          <em className="ext">
            <Icon icon={SquareArrowOutUpRight} size={depth > 0 ? 13 : 14} />
          </em>
        ) : null}
      </Link>
    );

    return depth > 0 ? (
      link
    ) : (
      <div className="sb-tree" key={menu.id}>
        <div className="sb-parent-row">{link}</div>
      </div>
    );
  }

  function showTip(event: React.MouseEvent<HTMLElement>, label: string) {
    if (!collapsed) {
      setTip(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setTip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 30,
    });
  }

  return (
    <>
      <aside
        className={resizing ? "sb is-resizing" : "sb"}
        id="sidebar"
        style={
          width === null
            ? undefined
            : { width, minWidth: width, maxWidth: width }
        }
        onMouseLeave={() => setTip(null)}
      >
        {collapsed ? null : (
          <div
            className="sb-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="Ubah lebar sidebar"
            title="Tarik untuk mengubah lebar, klik dua kali untuk mengembalikan"
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return;
              }

              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);

              const aside = event.currentTarget.parentElement;

              resizeStart.current = {
                x: event.clientX,
                width: aside?.getBoundingClientRect().width ?? 244,
              };
              setResizing(true);
            }}
            onPointerMove={(event) => {
              const start = resizeStart.current;

              if (!start) {
                return;
              }

              onResize(
                Math.round(
                  Math.min(
                    SIDEBAR_MAX_WIDTH,
                    Math.max(
                      SIDEBAR_MIN_WIDTH,
                      start.width + event.clientX - start.x,
                    ),
                  ),
                ),
              );
            }}
            onPointerUp={() => {
              resizeStart.current = null;
              setResizing(false);
            }}
            onPointerCancel={() => {
              resizeStart.current = null;
              setResizing(false);
            }}
            onDoubleClick={() => onResize(null)}
          />
        )}
        <div className="sb-brand">
          {showSkeleton ? (
            <span className="brand is-loading" aria-hidden="true">
              <span className="sk sk-brand-ic" />
              <span className="sk sk-brand-line" />
            </span>
          ) : (
            <Link
              className="brand brand-link"
              href="/overview"
              aria-label="SSO Launcher, ke Beranda"
            >
              <Image className="brand-logo" src={brandLogo} alt="" priority />
              <span className="brand-text">
                <b>
                  SSO<span>LAUNCHER</span>
                </b>
                <small>Portal akses aplikasi</small>
              </span>
            </Link>
          )}
        </div>

        <button
          className="sb-toggle"
          type="button"
          aria-label="Buka/tutup sidebar"
          onClick={onToggle}
        >
          <Icon icon={ChevronLeft} size={14} />
        </button>

        <nav className="sb-nav" id="sbNav" aria-label="Navigasi utama">
          {showSkeleton
            ? Array.from({ length: 6 }).map((_, index) => (
                <div className="sb-tree sk-nav" key={index} aria-hidden="true">
                  <span className="sk sk-nav-ic" />
                  <span className="sk sk-line" />
                </div>
              ))
            : sectionRoots.map((menu) => renderMenu(menu, 0))}

          {!showSkeleton && looseRoots.length > 0 ? (
            <div className="sb-section">
              <span className="sb-section-title" aria-hidden={collapsed}>
                Lainnya
              </span>
              {looseRoots.map((menu) => renderMenu(menu, 0))}
            </div>
          ) : null}
        </nav>

        {showSkeleton ? (
          <div className="sb-foot is-loading" aria-hidden="true">
            <span className="sk sk-foot-line" />
            <span className="sk sk-foot-text" />
          </div>
        ) : (
          <div className="sb-foot">
            <small className="full">
              SSO Launcher + Access Control <i>·</i> v{APP_VERSION}
            </small>
            <small className="mini">v{APP_VERSION}</small>
          </div>
        )}
      </aside>

      <div
        className={collapsed && tip ? "sb-tip show" : "sb-tip"}
        role="tooltip"
        style={
          tip
            ? {
                top: tip.top,
                left: tip.left,
              }
            : undefined
        }
      >
        {tip?.label}
      </div>
    </>
  );
}
