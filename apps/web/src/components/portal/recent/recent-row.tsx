"use client";

import { SquareArrowOutUpRight, Star, StarOff, Trash2 } from "lucide-react";
import { PickCheck } from "@/components/management/pick-check";
import { ActivityRow } from "@/components/portal/activity-row";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import type { PortalActivity, PortalApplication } from "@/types/portal";

type RecentRowProps = Readonly<{
  activity: PortalActivity;
  application: PortalApplication | undefined;
  number: number;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpen: () => void;
  onToggleFavorite: (applicationId: string) => void;
  onRemove: () => void;
}>;

export function RecentRow({
  activity,
  application,
  number,
  selected,
  onSelect,
  onOpen,
  onToggleFavorite,
  onRemove,
}: RecentRowProps) {
  return (
    <div className="rc-wrap">
      <ActivityRow
        activity={activity}
        application={application}
        number={number}
        selected={selected}
        select={
          <PickCheck
            checked={selected}
            label={`Pilih ${activity.title}`}
            onChange={onSelect}
          />
        }
        actions={
          <RowActionMenu
            label={`Aksi untuk ${activity.title}`}
            items={[
              {
                key: "open",
                label: "Buka Lagi",
                icon: SquareArrowOutUpRight,
                tone: "info",
                onSelect: onOpen,
              },
              application && {
                key: "favorite",
                label: application.isFavorite
                  ? "Hapus dari Favorit"
                  : "Tambah ke Favorit",
                icon: application.isFavorite ? StarOff : Star,
                tone: "warn",
                onSelect: () => onToggleFavorite(application.id),
              },
              {
                key: "remove",
                label: "Hapus dari Riwayat",
                icon: Trash2,
                tone: "danger",
                onSelect: onRemove,
              },
            ]}
          />
        }
      />
    </div>
  );
}
