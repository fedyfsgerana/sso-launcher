"use client";

import Link from "next/link";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Plus } from "lucide-react";
import { ActiveBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import type { BoardColumn } from "@/features/menus/menu-board";
import styles from "./menu-board.module.css";

type MenuBoardColumnProps = Readonly<{
  column: BoardColumn;
  dragging: boolean;
  dropClassName: string;
  canCreate: boolean;
  actions: ReactNode;
  children: ReactNode;
  onHeadPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

export function MenuBoardColumn({
  column,
  dragging,
  dropClassName,
  canCreate,
  actions,
  children,
  onHeadPointerDown,
}: MenuBoardColumnProps) {
  const { section } = column;

  return (
    <section
      data-drop-column={section?.id}
      className={[
        "card",
        styles.column,
        section && !section.isActive ? styles.off : "",
        dragging ? styles.dragging : "",
        dropClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className={styles.colHead} onPointerDown={onHeadPointerDown}>
        <b>{section?.label ?? "Tanpa Bagian"}</b>
        <span className={styles.count}>{column.total}</span>
        {section && !section.isActive ? <ActiveBadge active={false} /> : null}
        {section ? <span className={styles.colActs}>{actions}</span> : null}
      </header>

      {column.rows.length === 0 ? (
        <p className={styles.empty}>Belum ada menu di bagian ini.</p>
      ) : (
        <ul className={styles.list}>{children}</ul>
      )}

      {canCreate && section ? (
        <Link
          className={styles.addMenu}
          href={`/menus/new?parent=${section.id}`}
        >
          <Icon icon={Plus} size={16} />
          Tambah menu
        </Link>
      ) : null}
    </section>
  );
}

export function MenuBoardAddSection() {
  return (
    <Link className={styles.addSection} href="/menus/sections/new">
      <span>
        <Icon icon={Plus} size={20} />
      </span>
      <b>Tambah bagian</b>
      <small>Kelompok baru di sidebar</small>
    </Link>
  );
}
