"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import type { BoardRow } from "@/features/menus/menu-board";
import { resolveIcon } from "@/lib/icons";
import styles from "./menu-board.module.css";

type MenuBoardRowProps = Readonly<{
  row: BoardRow;
  nested: boolean;
  open: boolean;
  filtered: boolean;
  dragging: boolean;
  dropClassName: string;
  actions: ReactNode;
  onToggle: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

function MenuState({ menu }: Readonly<{ menu: AdminPortalMenu }>) {
  if (menu.maintenanceActive) {
    return (
      <span className={`${styles.state} ${styles.stateWarn}`}>Maintenance</span>
    );
  }

  if (!menu.isActive) {
    return (
      <span className={`${styles.state} ${styles.stateOff}`}>Nonaktif</span>
    );
  }

  return null;
}

function rowTitle(menu: AdminPortalMenu) {
  if (menu.maintenanceActive) {
    return "Mode perbaikan";
  }

  return menu.isActive ? undefined : "Nonaktif";
}

export function MenuBoardRow({
  row,
  nested,
  open,
  filtered,
  dragging,
  dropClassName,
  actions,
  onToggle,
  onPointerDown,
}: MenuBoardRowProps) {
  const { menu, depth, children } = row;

  return (
    <li
      data-drop-menu={menu.id}
      className={[
        styles.row,
        menu.isActive ? "" : styles.off,
        dragging ? styles.dragging : "",
        dropClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ paddingLeft: depth * 20 }}
      onPointerDown={onPointerDown}
      title={rowTitle(menu)}
    >
      {Array.from({ length: depth }, (_, level) => (
        <span
          key={level}
          className={styles.guide}
          style={{ left: level * 20 + 17 }}
          aria-hidden="true"
        />
      ))}
      <span className={styles.rowMain}>
        {children > 0 ? (
          <button
            className={styles.toggle}
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Tutup" : "Buka"} submenu ${menu.label}`}
            disabled={filtered}
            onClick={onToggle}
          >
            <Icon icon={open ? ChevronDown : ChevronRight} size={14} />
          </button>
        ) : nested ? (
          <span className={styles.toggleSpace} aria-hidden="true" />
        ) : null}
        <span className={styles.rowIcon}>
          <Icon icon={resolveIcon(menu.icon)} size={16} />
        </span>
        <span className={styles.rowLabel}>{menu.label}</span>
        {children > 0 ? <span className={styles.count}>{children}</span> : null}
        <MenuState menu={menu} />
      </span>
      <span className={styles.rowActs}>{actions}</span>
    </li>
  );
}
