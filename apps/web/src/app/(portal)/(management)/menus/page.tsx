"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, SearchX } from "lucide-react";
import { ActiveBulkBar } from "@/components/management/active-bulk-bar";
import {
  MenuBoardAddSection,
  MenuBoardColumn,
} from "@/components/management/menu-board/menu-board-column";
import { MenuBoardModals } from "@/components/management/menu-board/menu-board-modals";
import { MenuBoardRow } from "@/components/management/menu-board/menu-board-row";
import { MenuBoardToolbar } from "@/components/management/menu-board/menu-board-toolbar";
import { MenuDragGhost } from "@/components/management/menu-board/menu-drag-ghost";
import { MenuRowActions } from "@/components/management/menu-board/menu-row-actions";
import { MenuTreeTable } from "@/components/management/menu-tree/menu-tree-table";
import styles from "@/components/management/menu-board/menu-board.module.css";
import treeStyles from "@/components/management/menu-tree/menu-tree.module.css";
import { EmptyState } from "@/components/portal/empty-state";
import { PageHero } from "@/components/portal/page-hero";
import { Icon } from "@/components/ui/icon";
import {
  BarSkeleton,
  GridSkeleton,
  HeroSkeleton,
} from "@/components/portal/skeleton";
import type { ViewMode } from "@/components/ui/view-toggle";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import {
  boardSections,
  buildBoardColumns,
  groupChildren,
  isBoardFiltered,
  parentMenuIds,
} from "@/features/menus/menu-board";
import {
  buildMenuTree,
  collapsibleKeys,
  LOOSE_KEY,
  prefersTableView,
  selectableMenuIds,
} from "@/features/menus/menu-tree";
import { useAdminMenus } from "@/features/menus/use-admin-menus";
import { useMenuBulkActions } from "@/features/menus/use-menu-bulk-actions";
import { useMenuBoardActions } from "@/features/menus/use-menu-board-actions";
import { dropHint, useMenuDrag } from "@/features/menus/use-menu-drag";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { useStoredChoice } from "@/lib/portal/use-stored-choice";
import { useRowSelection } from "@/lib/portal/use-row-selection";

const VIEW_MODES: readonly ViewMode[] = ["grid", "list"];

export default function MenusPage() {
  const { refresh } = usePortalData();
  const { menus, setMenus, reload, loading } = useAdminMenus();
  const { can } = useMenuActions("menus");
  const [moving, setMoving] = useState<AdminPortalMenu | null>(null);
  const [deleting, setDeleting] = useState<AdminPortalMenu | null>(null);
  const [maintaining, setMaintaining] = useState<AdminPortalMenu | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const { user } = useAuthSession();
  const [chosenView, setChosenView] = useStoredChoice<ViewMode>(
    user ? `sso-menu-view:${user.id}` : null,
    VIEW_MODES,
  );
  const [sectionFilter, setSectionFilter] = useState("");
  const showSkeleton = useMinLoading(loading);

  const childrenOf = useMemo(() => groupChildren(menus), [menus]);
  const parentIds = useMemo(() => parentMenuIds(menus), [menus]);
  const sections = useMemo(() => boardSections(childrenOf), [childrenOf]);
  const columns = useMemo(
    () =>
      buildBoardColumns(childrenOf, sections, {
        query,
        status: statusFilter,
        collapsed,
      }),
    [childrenOf, collapsed, query, sections, statusFilter],
  );

  const view = chosenView ?? (prefersTableView(menus) ? "list" : "grid");
  const tableView = view === "list";
  const treeRows = useMemo(
    () =>
      buildMenuTree(menus, {
        query,
        status: statusFilter,
        section: sectionFilter,
        collapsed,
      }),
    [collapsed, menus, query, sectionFilter, statusFilter],
  );
  const toggleKeys = useMemo(() => collapsibleKeys(menus), [menus]);
  const allCollapsed =
    toggleKeys.length > 0 && toggleKeys.every((key) => collapsed.includes(key));
  const sectionOptions = useMemo(
    () => [
      ...sections.map((section) => ({
        value: section.id,
        label: section.label,
      })),
      ...(toggleKeys.includes(LOOSE_KEY)
        ? [{ value: LOOSE_KEY, label: "Tanpa Bagian" }]
        : []),
    ],
    [sections, toggleKeys],
  );

  const selectableIds = useMemo(() => selectableMenuIds(treeRows), [treeRows]);
  const selection = useRowSelection(selectableIds);
  const canBulk = can("update") || can("delete");

  const filtered = isBoardFiltered(query, statusFilter);
  const locked = filtered || !can("reorder");

  function refreshAll() {
    void reload();
    void refresh();
  }

  const boardActions = useMenuBoardActions({
    menus,
    sections,
    setMenus,
    reload,
    refresh,
  });

  const bulkActions = useMenuBulkActions({
    menus,
    onDone: selection.clear,
    reload,
    refresh,
  });

  const { drag, target, startDrag } = useMenuDrag({
    locked,
    onDrop: boardActions.drop,
  });

  const draggingId = drag?.active ? drag.id : null;
  const sectionMark =
    drag?.active && target?.kind === "section"
      ? { id: target.id, mode: target.mode }
      : null;

  function dropClass(kind: "menu" | "column", id: string) {
    if (!target || !drag?.active || target.id !== id) {
      return "";
    }

    if (kind === "menu" && target.kind === "menu") {
      return styles[`drop-${target.mode}`];
    }

    if (kind === "column" && target.kind === "section-end") {
      return styles["drop-column"];
    }

    if (kind === "column" && target.kind === "section") {
      return styles[`drop-col-${target.mode}`];
    }

    return "";
  }

  function treeDropClass(kind: "menu" | "column", id: string) {
    if (!target || !drag?.active || target.id !== id) {
      return "";
    }

    if (kind === "menu" && target.kind === "menu") {
      const modes = {
        before: treeStyles.dropBefore,
        after: treeStyles.dropAfter,
        nest: treeStyles.dropNest,
      };

      return modes[target.mode];
    }

    return kind === "column" && target.kind === "section-end"
      ? treeStyles.dropColumn
      : "";
  }

  function isDragging(kind: "menu" | "section", id: string | undefined) {
    return Boolean(drag?.active && drag.kind === kind && drag.id === id);
  }

  function toggleCollapsed(menuId: string) {
    setCollapsed((value) =>
      value.includes(menuId)
        ? value.filter((id) => id !== menuId)
        : [...value, menuId],
    );
  }

  function actionsFor(menu: AdminPortalMenu) {
    return (
      <MenuRowActions
        menu={menu}
        can={can}
        hasSubmenus={parentIds.has(menu.id)}
        onToggleActive={(item, next) =>
          void boardActions.toggleActive(item, next)
        }
        onMaintenance={setMaintaining}
        onMove={setMoving}
        onDelete={setDeleting}
      />
    );
  }

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Manajemen Menu"
          description="Susunan di bawah sama dengan urutan sidebar pengguna."
          actions={
            can("create") ? (
              <Link className="btn" href="/menus/sections/new">
                Tambah Bagian
                <Icon icon={Plus} size={18} />
              </Link>
            ) : undefined
          }
        />
      )}

      {showSkeleton ? (
        <>
          <BarSkeleton />
          <GridSkeleton cards={4} />
        </>
      ) : (
        <div className={styles.stack}>
          <section className={`card ${styles.boardCard}`}>
            <MenuBoardToolbar
              query={query}
              status={statusFilter}
              view={view}
              section={sectionFilter}
              sectionOptions={sectionOptions}
              allCollapsed={allCollapsed}
              onQueryChange={setQuery}
              onStatusChange={setStatusFilter}
              onViewChange={setChosenView}
              onSectionChange={setSectionFilter}
              onToggleAll={() => setCollapsed(allCollapsed ? [] : toggleKeys)}
              onReset={() => {
                setQuery("");
                setStatusFilter("");
                setSectionFilter("");
              }}
            />

            {tableView ? (
              treeRows.length === 0 ? (
                <div className={styles.boardBody}>
                  <EmptyState
                    badge={SearchX}
                    title="Menu tidak ditemukan"
                    description="Coba ubah kata kunci atau filter."
                    inPanel
                  />
                </div>
              ) : (
                <>
                  {selection.selected.length > 0 ? (
                    <ActiveBulkBar
                      count={selection.selected.length}
                      noun="menu"
                      canUpdate={can("update")}
                      canDelete={can("delete")}
                      onAction={(action) =>
                        void bulkActions.bulk(selection.selected, action)
                      }
                    />
                  ) : null}

                  <MenuTreeTable
                    rows={treeRows}
                    filtered={filtered}
                    selection={canBulk ? selection : null}
                    draggable={!locked}
                    canCreate={can("create")}
                    draggingId={draggingId}
                    sectionMark={sectionMark}
                    dropClassFor={treeDropClass}
                    actionsFor={actionsFor}
                    onToggle={toggleCollapsed}
                    onDragStart={(event, menu) =>
                      startDrag(event, "menu", menu)
                    }
                    onSectionDragStart={(event, section) =>
                      startDrag(event, "section", section)
                    }
                  />
                </>
              )
            ) : (
              <div className={styles.boardBody}>
                {columns.length === 0 ? (
                  <EmptyState
                    badge={filtered ? SearchX : undefined}
                    title={filtered ? "Menu tidak ditemukan" : "Belum ada menu"}
                    description={
                      filtered
                        ? "Coba ubah kata kunci atau filter."
                        : "Tambahkan bagian, lalu isi dengan menu."
                    }
                    inPanel
                  />
                ) : (
                  <div className={styles.board}>
                    {columns.map((column) => {
                      const nested = column.rows.some(
                        (item) => item.children > 0,
                      );

                      return (
                        <MenuBoardColumn
                          key={column.key}
                          column={column}
                          dragging={isDragging("section", column.section?.id)}
                          dropClassName={
                            column.section
                              ? dropClass("column", column.section.id)
                              : ""
                          }
                          canCreate={can("create")}
                          actions={
                            column.section ? actionsFor(column.section) : null
                          }
                          onHeadPointerDown={(event) => {
                            if (column.section) {
                              startDrag(event, "section", column.section);
                            }
                          }}
                        >
                          {column.rows.map((row) => (
                            <MenuBoardRow
                              key={row.menu.id}
                              row={row}
                              nested={nested}
                              open={
                                !collapsed.includes(row.menu.id) || filtered
                              }
                              filtered={filtered}
                              dragging={isDragging("menu", row.menu.id)}
                              dropClassName={dropClass("menu", row.menu.id)}
                              actions={actionsFor(row.menu)}
                              onToggle={() => toggleCollapsed(row.menu.id)}
                              onPointerDown={(event) =>
                                startDrag(event, "menu", row.menu)
                              }
                            />
                          ))}
                        </MenuBoardColumn>
                      );
                    })}

                    {can("create") && !filtered ? (
                      <MenuBoardAddSection />
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {drag?.active ? (
        <MenuDragGhost
          drag={drag}
          hint={dropHint(target, tableView ? "y" : "x")}
        />
      ) : null}

      <MenuBoardModals
        menus={menus}
        sections={sections}
        deleting={deleting}
        moving={moving}
        maintaining={maintaining}
        onCloseDelete={() => setDeleting(null)}
        onCloseMove={() => setMoving(null)}
        onCloseMaintenance={() => setMaintaining(null)}
        onChanged={refreshAll}
      />
    </div>
  );
}
