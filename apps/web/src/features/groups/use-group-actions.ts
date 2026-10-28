"use client";

import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  deleteGroup,
  updateGroup,
  type UserGroup,
} from "@/features/groups/api";

export type GroupBulkAction = "activate" | "deactivate" | "delete";

type GroupActionsOptions = Readonly<{
  onChanged: () => void;
  onBulkDone: () => void;
}>;

const ACCESS_LOSS =
  "langsung kehilangan menu dan aplikasi yang diberikan lewat grup ini.";

function setActive(group: UserGroup, isActive: boolean) {
  return updateGroup(group.id, {
    name: group.name,
    description: group.description,
    department: group.department,
    isActive,
  });
}

export function useGroupActions({
  onChanged,
  onBulkDone,
}: GroupActionsOptions) {
  const { confirm, confirmWithReason } = useConfirm();
  const { showToast } = useToast();

  async function askBulk(action: GroupBulkAction, count: number) {
    if (action === "delete") {
      return confirmWithReason({
        title: `Hapus ${count} grup?`,
        message: `Grup terpilih akan dihapus. Pengguna di dalamnya ${ACCESS_LOSS}`,
        confirmLabel: "Hapus",
        danger: true,
        action: "delete",
        reasonLabel: "Alasan penghapusan",
        reasonPlaceholder: "Masukkan alasan penghapusan",
      });
    }

    const approved = await confirm({
      title: `${action === "activate" ? "Aktifkan" : "Nonaktifkan"} ${count} grup?`,
      message:
        action === "activate"
          ? "Pengguna dalam grup terpilih akan kembali mendapat akses dari grup itu."
          : "Pengguna dalam grup terpilih akan kehilangan menu dan aplikasi yang diberikan lewat grup itu.",
      confirmLabel: action === "activate" ? "Aktifkan" : "Nonaktifkan",
      danger: action !== "activate",
      action,
    });

    return approved ? "" : null;
  }

  async function bulk(targets: readonly UserGroup[], action: GroupBulkAction) {
    if (targets.length === 0) {
      return;
    }

    const count = targets.length;
    const reason = await askBulk(action, count);

    if (reason === null) {
      return;
    }

    let done = 0;

    for (const group of targets) {
      try {
        if (action === "delete") {
          await deleteGroup(group.id, reason);
        } else {
          await setActive(group, action === "activate");
        }

        done += 1;
      } catch {
        continue;
      }
    }

    onBulkDone();
    onChanged();

    if (done === count) {
      showToast(
        action === "delete"
          ? `${done} grup dihapus`
          : `${done} grup ${action === "activate" ? "diaktifkan" : "dinonaktifkan"}`,
      );

      return;
    }

    showToast(`${done} dari ${count} grup diproses. Sisanya gagal.`, "warning");
  }

  async function toggleActive(group: UserGroup) {
    const next = !group.isActive;

    const approved = await confirm({
      title: next ? "Aktifkan grup?" : "Nonaktifkan grup?",
      message: next
        ? `Pengguna dalam grup "${group.name}" akan kembali mendapat akses dari grup ini.`
        : `Pengguna dalam grup "${group.name}" akan kehilangan menu dan aplikasi yang diberikan lewat grup ini.`,
      confirmLabel: next ? "Aktifkan" : "Nonaktifkan",
      danger: !next,
      action: next ? "activate" : "deactivate",
    });

    if (!approved) {
      return;
    }

    try {
      await setActive(group, next);
      onChanged();
      showToast(`Grup ${group.name} ${next ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      showToast("Status grup gagal diperbarui.", "error");
    }
  }

  async function remove(group: UserGroup) {
    const reason = await confirmWithReason({
      title: "Hapus grup?",
      message: `Grup "${group.name}" akan dihapus. Pengguna di dalamnya ${ACCESS_LOSS}`,
      confirmLabel: "Hapus",
      danger: true,
      action: "delete",
      reasonLabel: "Alasan penghapusan",
      reasonPlaceholder: "Masukkan alasan penghapusan",
    });

    if (reason === null) {
      return;
    }

    try {
      await deleteGroup(group.id, reason);
      onChanged();
      showToast(`Grup ${group.name} dihapus`);
    } catch {
      showToast("Grup gagal dihapus.", "error");
    }
  }

  return { bulk, toggleActive, remove };
}
