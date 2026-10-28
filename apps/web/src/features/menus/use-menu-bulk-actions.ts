"use client";

import type { ActiveBulkAction } from "@/components/management/active-bulk-bar";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  deletePortalMenu,
  updatePortalMenu,
  type AdminPortalMenu,
} from "@/features/menus/admin-api";
import { deletableMenuIds } from "@/features/menus/menu-tree";

type MenuBulkActionsOptions = Readonly<{
  menus: readonly AdminPortalMenu[];
  onDone: () => void;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}>;

const VERBS: Record<ActiveBulkAction, string> = {
  activate: "diaktifkan",
  deactivate: "dinonaktifkan",
  delete: "dihapus",
};

export function useMenuBulkActions({
  menus,
  onDone,
  reload,
  refresh,
}: MenuBulkActionsOptions) {
  const { confirm, confirmWithReason } = useConfirm();
  const { showToast } = useToast();

  async function ask(action: ActiveBulkAction, count: number) {
    if (action === "delete") {
      return confirmWithReason({
        title: `Hapus ${count} menu?`,
        message:
          "Menu terpilih dipindahkan ke Tempat Sampah, dan submenunya naik " +
          "satu tingkat ke induknya. Menu sistem dilewati.",
        confirmLabel: "Hapus",
        danger: true,
        action: "delete",
        reasonLabel: "Alasan penghapusan",
        reasonPlaceholder: "Masukkan alasan penghapusan",
      });
    }

    const activate = action === "activate";
    const approved = await confirm({
      title: `${activate ? "Aktifkan" : "Nonaktifkan"} ${count} menu?`,
      message: activate
        ? "Menu terpilih tampil kembali di sidebar pengguna yang punya akses."
        : "Menu terpilih disembunyikan dari sidebar beserta submenunya.",
      confirmLabel: activate ? "Aktifkan" : "Nonaktifkan",
      danger: !activate,
      action,
    });

    return approved ? "" : null;
  }

  async function setActive(menu: AdminPortalMenu, isActive: boolean) {
    await updatePortalMenu(menu.id, {
      label: menu.label,
      icon: menu.icon,
      parentId: menu.parentId,
      targetType: menu.targetType,
      targetValue: menu.targetValue,
      isActive,
    });
  }

  async function bulk(ids: readonly string[], action: ActiveBulkAction) {
    const chosen = action === "delete" ? deletableMenuIds(menus, ids) : ids;
    const targets = menus.filter((menu) => chosen.includes(menu.id));
    const count = ids.length;

    if (count === 0) {
      return;
    }

    const reason = await ask(action, count);

    if (reason === null) {
      return;
    }

    let done = 0;

    for (const menu of targets) {
      const succeeded =
        action === "delete"
          ? await deletePortalMenu(menu.id, reason)
              .then(() => true)
              .catch(() => false)
          : await setActive(menu, action === "activate")
              .then(() => true)
              .catch(() => false);

      if (succeeded) {
        done += 1;
      }
    }

    onDone();
    await reload();
    await refresh();

    if (done === count) {
      showToast(`${done} menu ${VERBS[action]}`);
      return;
    }

    showToast(
      `${done} dari ${count} menu ${VERBS[action]}. ` +
        "Sisanya dilewati atau gagal.",
      "warning",
    );
  }

  return { bulk };
}
