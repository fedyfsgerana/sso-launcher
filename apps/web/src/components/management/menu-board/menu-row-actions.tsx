"use client";

import { ArrowRightLeft, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import {
  RowActionMenu,
  type RowActionItem,
} from "@/components/ui/row-action-menu";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import { activeActionIcon, activeActionLabel } from "@/lib/portal/action-icons";
import { useAppRouter } from "@/lib/portal/use-app-router";

type MenuRowActionsProps = Readonly<{
  menu: AdminPortalMenu;
  can: (actionKey: string) => boolean;
  hasSubmenus: boolean;
  onToggleActive: (menu: AdminPortalMenu, next: boolean) => void;
  onMaintenance: (menu: AdminPortalMenu) => void;
  onMove: (menu: AdminPortalMenu) => void;
  onDelete: (menu: AdminPortalMenu) => void;
}>;

export function MenuRowActions({
  menu,
  can,
  hasSubmenus,
  onToggleActive,
  onMaintenance,
  onMove,
  onDelete,
}: MenuRowActionsProps) {
  const router = useAppRouter();
  const isSection = menu.targetType === "section";
  const items: RowActionItem[] = [];

  if (can("create")) {
    items.push({
      key: "add",
      label: isSection ? "Tambah Menu" : "Tambah Submenu",
      icon: Plus,
      tone: "primary",
      onSelect: () => router.push(`/menus/new?parent=${menu.id}`),
    });
  }

  if (can("update")) {
    items.push(
      {
        key: "edit",
        label: "Ubah",
        icon: Pencil,
        tone: "primary",
        onSelect: () =>
          router.push(
            isSection ? `/menus/sections/${menu.id}` : `/menus/${menu.id}`,
          ),
      },
      {
        key: "active",
        label: activeActionLabel(menu.isActive),
        icon: activeActionIcon(menu.isActive),
        tone: menu.isActive ? "danger" : "success",
        onSelect: () => onToggleActive(menu, !menu.isActive),
      },
    );
  }

  if (
    can("maintenance") &&
    !isSection &&
    (!hasSubmenus || menu.maintenanceActive)
  ) {
    items.push({
      key: "maintenance",
      label: menu.maintenanceActive ? "Atur Mode Perbaikan" : "Mode Perbaikan",
      icon: Wrench,
      tone: "warn",
      onSelect: () => onMaintenance(menu),
    });
  }

  if (can("update") && !isSection) {
    items.push({
      key: "move",
      label: "Pindah Posisi",
      icon: ArrowRightLeft,
      tone: "info",
      onSelect: () => onMove(menu),
    });
  }

  if (can("delete") && !(menu.isSystem && !isSection)) {
    items.push({
      key: "delete",
      label: "Hapus",
      icon: Trash2,
      tone: "danger",
      onSelect: () => onDelete(menu),
    });
  }

  return <RowActionMenu label={`Aksi untuk ${menu.label}`} items={items} />;
}
