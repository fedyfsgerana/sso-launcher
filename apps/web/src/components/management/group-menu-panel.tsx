"use client";

import { SearchX } from "lucide-react";
import { MenuAccessColumn } from "@/components/management/group-menu/menu-access-column";
import { MenuAccessTable } from "@/components/management/group-menu/menu-access-table";
import { PickFooter } from "@/components/management/pick-footer";
import { PickToolbar } from "@/components/management/pick-toolbar";
import { EmptyState } from "@/components/portal/empty-state";
import {
  BarSkeleton,
  GridSkeleton,
  PagerSkeleton,
} from "@/components/portal/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import type { UserGroupDetail } from "@/features/groups/api";
import { useGroupMenuAccess } from "@/features/groups/use-group-menu-access";
import { prefersTableView } from "@/features/menus/menu-tree";
import { useStoredChoice } from "@/lib/portal/use-stored-choice";
import styles from "./group-menu/group-menu.module.css";

const VIEW_MODES: readonly ViewMode[] = ["grid", "list"];

type GroupMenuPanelProps = Readonly<{
  detail: UserGroupDetail;
  onSaved: () => void;
}>;

export function GroupMenuPanel({ detail, onSaved }: GroupMenuPanelProps) {
  const controller = useGroupMenuAccess(detail, onSaved);
  const { menus, columns, query, view } = controller;
  const filtered = Boolean(query || view);
  const { user } = useAuthSession();
  const [chosenLayout, setLayout] = useStoredChoice<ViewMode>(
    user ? `sso-group-menu-view:${user.id}` : null,
    VIEW_MODES,
  );
  const layout =
    chosenLayout ?? (menus && prefersTableView(menus) ? "list" : "grid");

  if (menus === null) {
    return (
      <div className="pk-panel">
        <BarSkeleton />
        <GridSkeleton cards={4} />
        <PagerSkeleton />
      </div>
    );
  }

  return (
    <div className="pk-panel">
      <PickToolbar
        query={query}
        placeholder="Cari menu"
        view={view}
        counts={{
          all: menus.length,
          selected: controller.selectedCount,
          unselected: Math.max(0, menus.length - controller.selectedCount),
        }}
        extra={
          <ViewToggle
            value={layout}
            labels={{ grid: "Tampilan kolom", list: "Tampilan tabel" }}
            onChange={setLayout}
          />
        }
        onQuery={controller.setQuery}
        onView={controller.setView}
      />

      <div className="pk-info">
        <span>
          Akses tersimpan <b>{controller.savedCount} menu</b>
        </span>
        <span className="pk-hint">
          Menu yang dicentang tampil di sidebar anggota grup ini. Mencentang
          submenu ikut memilih induknya.
        </span>
      </div>

      <div className={styles.body}>
        {columns.length === 0 ? (
          <EmptyState
            badge={filtered ? SearchX : undefined}
            title={filtered ? "Menu tidak ditemukan" : "Belum ada menu"}
            description={
              filtered
                ? "Coba ubah kata kunci atau filter."
                : "Tambahkan menu lewat Manajemen Menu."
            }
            inPanel
          />
        ) : layout === "list" ? (
          <MenuAccessTable columns={columns} controller={controller} />
        ) : (
          <div className={styles.board}>
            {columns.map((column) => (
              <MenuAccessColumn
                key={column.section?.menu.id ?? "loose"}
                column={column}
                controller={controller}
              />
            ))}
          </div>
        )}
      </div>

      <PickFooter
        selected={controller.selectedCount}
        total={menus.length}
        unit="menu"
        dirty={controller.dirty}
        saving={controller.saving}
        added={controller.addedCount}
        removed={controller.removedCount}
        removedLabel="dicabut"
        cancelHref="/groups"
        onSave={() => void controller.save()}
      />
    </div>
  );
}
