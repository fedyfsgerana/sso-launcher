"use client";

import { ArrowUpDown, CornerDownRight } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  reorderPortalMenus,
  updatePortalMenu,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";
import {
  isDescendantMenu,
  normalizeOrders,
  placeMenuAmong,
} from "@/features/menus/menu-board";
import type { DragKind, DropTarget } from "@/features/menus/use-menu-drag";

type MenuBoardActionsOptions = Readonly<{
  menus: readonly AdminPortalMenu[];
  sections: readonly AdminPortalMenu[];
  setMenus: (menus: AdminPortalMenu[]) => void;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}>;

export function useMenuBoardActions({
  menus,
  sections,
  setMenus,
  reload,
  refresh,
}: MenuBoardActionsOptions) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  async function persist(next: AdminPortalMenu[], message: string) {
    const normalized = normalizeOrders(next);

    setMenus(normalized);

    try {
      await reorderPortalMenus(
        normalized.map((menu) => ({
          id: menu.id,
          parentId: menu.parentId,
          sortOrder: menu.sortOrder,
        })),
      );
      showToast(message);
    } catch {
      showToast("Susunan menu gagal disimpan", "error");
    } finally {
      await reload();
      await refresh();
    }
  }

  async function dropMenu(sourceId: string, drop: DropTarget) {
    const source = menus.find((menu) => menu.id === sourceId);

    if (!source || drop.kind === "section") {
      return;
    }

    const anchor = menus.find((menu) => menu.id === drop.id);

    if (!anchor || anchor.id === source.id) {
      return;
    }

    if (isDescendantMenu(menus, anchor.id, source.id)) {
      showToast(
        "Menu tidak bisa dipindahkan ke dalam submenunya sendiri.",
        "error",
      );
      return;
    }

    const nest = drop.kind === "section-end" || drop.mode === "nest";
    const parentId = nest ? anchor.id : anchor.parentId;

    if (parentId !== source.parentId) {
      const parent = menus.find((menu) => menu.id === parentId);
      const approved = await confirm({
        title:
          nest && parent?.targetType !== "section"
            ? "Jadikan submenu?"
            : "Pindahkan menu?",
        message:
          parent?.targetType === "section"
            ? `"${source.label}" akan menjadi menu utama di bagian "${parent.label}".`
            : `"${source.label}" akan menjadi submenu dari "${parent?.label ?? "menu utama"}".`,
        confirmLabel: "Ya, Pindahkan",
        icon: nest ? CornerDownRight : ArrowUpDown,
        tone: "info",
      });

      if (!approved) {
        return;
      }
    }

    const next = nest
      ? placeMenuAmong(menus, source, parentId, null, "end")
      : placeMenuAmong(
          menus,
          source,
          parentId,
          anchor.id,
          drop.mode === "after" ? "after" : "before",
        );

    await persist(next, "Susunan menu diperbarui");
  }

  async function dropSection(sourceId: string, drop: DropTarget) {
    const source = sections.find((section) => section.id === sourceId);

    if (!source || drop.kind !== "section" || drop.id === sourceId) {
      return;
    }

    await persist(
      placeMenuAmong(menus, source, null, drop.id, drop.mode),
      "Urutan bagian diperbarui",
    );
  }

  function drop(kind: DragKind, id: string, target: DropTarget) {
    return kind === "menu" ? dropMenu(id, target) : dropSection(id, target);
  }

  async function toggleActive(menu: AdminPortalMenu, next: boolean) {
    const isSection = menu.targetType === "section";
    const approved = await confirm({
      title: next
        ? `Aktifkan ${isSection ? "bagian" : "menu"}?`
        : `Nonaktifkan ${isSection ? "bagian" : "menu"}?`,
      message: next
        ? `"${menu.label}" akan diaktifkan.`
        : `"${menu.label}" akan disembunyikan dari sidebar beserta isinya.`,
      confirmLabel: next ? "Aktifkan" : "Nonaktifkan",
      danger: !next,
      action: next ? "activate" : "deactivate",
    });

    if (!approved) {
      return;
    }

    try {
      await updatePortalMenu(menu.id, {
        label: menu.label,
        icon: menu.icon,
        parentId: menu.parentId,
        targetType: menu.targetType,
        targetValue: menu.targetValue,
        isActive: next,
      });
      await reload();
      await refresh();
      showToast(`${menu.label} ${next ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      showToast("Status gagal diperbarui", "error");
    }
  }

  return { drop, toggleActive };
}
