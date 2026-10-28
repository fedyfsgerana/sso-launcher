"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, UsersRound } from "lucide-react";
import { PickCheck } from "@/components/management/pick-check";
import {
  ApplicationStatusBadge,
  CountBadge,
} from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import type { TreeRow } from "@/features/menus/menu-tree";
import { resolveIcon } from "@/lib/icons";
import { formatRelative } from "@/lib/portal/format";
import styles from "./menu-tree.module.css";

type TreeSelection = Readonly<{
  allChecked: boolean;
  someChecked: boolean;
  isSelected: (id: string) => boolean;
  toggleOne: (id: string, checked: boolean) => void;
  toggleAll: (checked: boolean) => void;
}>;

export type SectionDropMark = Readonly<{
  id: string;
  mode: "before" | "after";
}>;

type MenuTreeTableProps = Readonly<{
  rows: readonly TreeRow[];
  filtered: boolean;
  selection: TreeSelection | null;
  draggable: boolean;
  canCreate: boolean;
  draggingId: string | null;
  sectionMark: SectionDropMark | null;
  dropClassFor: (kind: "menu" | "column", id: string) => string;
  actionsFor: (menu: AdminPortalMenu) => ReactNode;
  onToggle: (key: string) => void;
  onDragStart: (
    event: ReactPointerEvent<HTMLElement>,
    menu: AdminPortalMenu,
  ) => void;
  onSectionDragStart: (
    event: ReactPointerEvent<HTMLElement>,
    section: AdminPortalMenu,
  ) => void;
}>;

function sectionOf(rows: readonly TreeRow[]) {
  const owner = new Map<string, string | undefined>();
  let current: string | undefined;

  for (const row of rows) {
    if (row.kind === "section") {
      current = row.menu?.id;
    }

    owner.set(row.key, current);
  }

  return owner;
}

function markLines(rows: readonly TreeRow[], mark: SectionDropMark | null) {
  const lines = new Map<string, "top" | "bottom">();

  if (!mark) {
    return lines;
  }

  const heads = rows.filter((row) => row.kind === "section" && row.menu);
  const index = heads.findIndex((row) => row.key === mark.id);

  if (index < 0) {
    return lines;
  }

  if (mark.mode === "before") {
    lines.set(heads[index].key, "top");
  } else if (index + 1 < heads.length) {
    lines.set(heads[index + 1].key, "top");
  } else {
    const last = rows[rows.length - 1];

    lines.set(last.key, "bottom");
  }

  return lines;
}

function menuStatus(menu: AdminPortalMenu) {
  if (menu.maintenanceActive) {
    return "maintenance";
  }

  return menu.isActive ? "active" : "inactive";
}

function Toggle({
  row,
  label,
  filtered,
  onToggle,
}: Readonly<{
  row: TreeRow;
  label: string;
  filtered: boolean;
  onToggle: (key: string) => void;
}>) {
  if (row.children === 0) {
    return <span className={styles.toggleSpace} aria-hidden="true" />;
  }

  return (
    <button
      className={styles.toggle}
      type="button"
      aria-expanded={row.expanded}
      aria-label={`${row.expanded ? "Tutup" : "Buka"} ${label}`}
      disabled={filtered}
      onClick={() => onToggle(row.key)}
    >
      <Icon icon={row.expanded ? ChevronDown : ChevronRight} size={14} />
    </button>
  );
}

export function MenuTreeTable({
  rows,
  filtered,
  selection,
  draggable,
  canCreate,
  draggingId,
  sectionMark,
  dropClassFor,
  actionsFor,
  onToggle,
  onDragStart,
  onSectionDragStart,
}: MenuTreeTableProps) {
  const columns = selection ? 7 : 6;
  const owners = sectionOf(rows);
  const lines = markLines(rows, sectionMark);

  function lineClass(key: string) {
    const line = lines.get(key);

    if (line === "top") {
      return styles.lineTop;
    }

    return line === "bottom" ? styles.lineBottom : "";
  }

  return (
    <div className="table-wrap">
      <table className={`dt ut ${styles.table}`}>
        <thead>
          <tr>
            {selection ? (
              <th className={styles.checkCol}>
                <PickCheck
                  checked={selection.allChecked}
                  indeterminate={selection.someChecked}
                  label="Pilih semua menu"
                  onChange={selection.toggleAll}
                />
              </th>
            ) : null}
            <th>Menu</th>
            <th>Alamat</th>
            <th>Akses grup</th>
            <th>Status</th>
            <th>Diubah</th>
            <th className={styles.actCol}>
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const label = row.menu?.label ?? "Tanpa Bagian";

            if (row.kind === "section") {
              return (
                <tr
                  key={row.key}
                  data-drop-column={row.menu?.id}
                  data-drop-axis="y"
                  className={[
                    styles.section,
                    draggable && row.menu ? styles.draggable : "",
                    draggingId === row.menu?.id ? styles.dragging : "",
                    row.menu ? dropClassFor("column", row.menu.id) : "",
                    lineClass(row.key),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPointerDown={
                    draggable && row.menu
                      ? (event) =>
                          onSectionDragStart(event, row.menu as AdminPortalMenu)
                      : undefined
                  }
                >
                  <td colSpan={columns - 1}>
                    <span className={styles.cell}>
                      <Toggle
                        row={row}
                        label={label}
                        filtered={filtered}
                        onToggle={onToggle}
                      />
                      <b>{label}</b>
                      <span className={styles.count}>{row.children}</span>
                      {row.menu && !row.menu.isActive ? (
                        <ApplicationStatusBadge status="inactive" />
                      ) : null}
                    </span>
                  </td>
                  <td className={styles.actCol}>
                    {row.menu ? actionsFor(row.menu) : null}
                  </td>
                </tr>
              );
            }

            const menu = row.menu as AdminPortalMenu;

            return (
              <tr
                key={row.key}
                data-drop-menu={menu.id}
                data-drop-column={owners.get(row.key)}
                data-drop-axis="y"
                className={
                  [
                    row.matched ? "" : styles.context,
                    draggable ? styles.draggable : "",
                    draggingId === menu.id ? styles.dragging : "",
                    draggingId && draggingId === owners.get(row.key)
                      ? styles.dragging
                      : "",
                    dropClassFor("menu", menu.id),
                    lineClass(row.key),
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                onPointerDown={
                  draggable ? (event) => onDragStart(event, menu) : undefined
                }
              >
                {selection ? (
                  <td className={styles.checkCol}>
                    <PickCheck
                      checked={selection.isSelected(menu.id)}
                      label={`Pilih ${label}`}
                      onChange={(checked) =>
                        selection.toggleOne(menu.id, checked)
                      }
                    />
                  </td>
                ) : null}
                <td>
                  <span
                    className={styles.cell}
                    style={{ paddingLeft: (row.depth - 1) * 22 }}
                  >
                    <Toggle
                      row={row}
                      label={`submenu ${label}`}
                      filtered={filtered}
                      onToggle={onToggle}
                    />
                    <span className={styles.icon}>
                      <Icon icon={resolveIcon(menu.icon)} size={16} />
                    </span>
                    <span className={styles.label}>{label}</span>
                  </span>
                </td>
                <td>
                  <code className={styles.path}>{menu.targetValue}</code>
                </td>
                <td>
                  <CountBadge
                    count={menu.groupIds.length}
                    unit="grup"
                    icon={UsersRound}
                    tone="purple"
                  />
                </td>
                <td>
                  <ApplicationStatusBadge status={menuStatus(menu)} />
                </td>
                <td className={styles.time}>
                  {formatRelative(menu.updatedAt)}
                </td>
                <td className={styles.actCol}>{actionsFor(menu)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {canCreate && !filtered ? (
        <Link className={styles.addSection} href="/menus/sections/new">
          <Icon icon={Plus} size={16} />
          Tambah bagian
        </Link>
      ) : null}
    </div>
  );
}
