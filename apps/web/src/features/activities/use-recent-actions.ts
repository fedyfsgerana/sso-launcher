"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { usePortalData } from "@/features/portal/portal-data-provider";
import type { PortalActivity } from "@/types/portal";

type RecentActionsOptions = Readonly<{
  onRemovedMany: () => void;
}>;

export function useRecentActions({ onRemovedMany }: RecentActionsOptions) {
  const { activities, removeActivity, clearActivity } = usePortalData();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [removing, setRemoving] = useState(false);

  async function clearAll() {
    if (activities.length === 0) {
      return;
    }

    const approved = await confirm({
      title: "Bersihkan semua riwayat?",
      message:
        "Semua aktivitas di halaman Terbaru akan dihapus dari daftar Anda. Aplikasi dan favorit Anda tidak terpengaruh.",
      confirmLabel: "Ya, Bersihkan",
      danger: true,
      icon: Trash2,
    });

    if (!approved) {
      return;
    }

    try {
      await clearActivity();
      showToast("Riwayat berhasil dibersihkan");
    } catch {
      showToast("Riwayat gagal dibersihkan. Silakan coba lagi.", "error");
    }
  }

  async function removeOne(activity: PortalActivity) {
    const approved = await confirm({
      title: "Hapus dari riwayat?",
      message: `"${activity.title}" akan dihapus dari daftar Terbaru.`,
      confirmLabel: "Ya, Hapus",
      danger: true,
      icon: Trash2,
    });

    if (!approved) {
      return;
    }

    try {
      await removeActivity(activity.id);
      showToast("Dihapus dari riwayat");
    } catch {
      showToast("Aktivitas gagal dihapus. Silakan coba lagi.", "error");
    }
  }

  async function removeMany(ids: readonly string[]) {
    const count = ids.length;

    if (count === 0 || removing) {
      return;
    }

    const approved = await confirm({
      title: `Hapus ${count} aktivitas dari riwayat?`,
      message: "Aktivitas terpilih akan dihapus dari daftar Terbaru.",
      confirmLabel: "Ya, Hapus",
      danger: true,
      icon: Trash2,
    });

    if (!approved) {
      return;
    }

    setRemoving(true);

    let failed = 0;

    for (const id of ids) {
      try {
        await removeActivity(id);
      } catch {
        failed += 1;
      }
    }

    setRemoving(false);
    onRemovedMany();

    showToast(
      failed === 0
        ? `${count} aktivitas dihapus dari riwayat`
        : `${count - failed} aktivitas dihapus, ${failed} gagal dihapus`,
      failed === 0 ? undefined : "error",
    );
  }

  return { removing, clearAll, removeOne, removeMany };
}
