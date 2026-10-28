"use client";

import { useCallback } from "react";
import { Star } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { usePortalData } from "@/features/portal/portal-data-provider";

export function useFavoriteToggle() {
  const { applications, toggleFavorite } = usePortalData();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  return useCallback(
    async (applicationId: string) => {
      const application = applications.find(
        (item) => item.id === applicationId,
      );

      if (!application) {
        return;
      }

      const on = application.isFavorite;

      const approved = await confirm({
        title: on ? "Hapus dari favorit?" : "Tambah ke favorit?",
        message: on
          ? `${application.name} akan dihapus dari daftar Favorit.`
          : `${application.name} akan ditambahkan ke daftar Favorit.`,
        confirmLabel: on ? "Hapus" : "Tambahkan",
        danger: on,
        icon: Star,
      });

      if (!approved) {
        return;
      }

      await toggleFavorite(applicationId);

      showToast(
        `${application.name} ${on ? "dihapus dari" : "ditambahkan ke"} favorit`,
      );
    },
    [applications, confirm, showToast, toggleFavorite],
  );
}
