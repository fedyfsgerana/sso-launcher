"use client";

import { Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { ActivateIcon, DeactivateIcon } from "@/lib/portal/action-icons";

export type ActiveBulkAction = "activate" | "deactivate" | "delete";

type ActiveBulkBarProps = Readonly<{
  count: number;
  noun: string;
  canUpdate: boolean;
  canDelete: boolean;
  onAction: (action: ActiveBulkAction) => void;
}>;

export function ActiveBulkBar({
  count,
  noun,
  canUpdate,
  canDelete,
  onAction,
}: ActiveBulkBarProps) {
  return (
    <div className="bulk">
      <span>
        {count} {noun} dipilih
      </span>

      {canUpdate ? (
        <>
          <button
            className="ac-btn success"
            type="button"
            onClick={() => onAction("activate")}
          >
            Aktifkan
            <Icon icon={ActivateIcon} size={15} />
          </button>

          <button
            className="ac-btn danger"
            type="button"
            onClick={() => onAction("deactivate")}
          >
            Nonaktifkan
            <Icon icon={DeactivateIcon} size={15} />
          </button>
        </>
      ) : null}

      {canDelete ? (
        <button
          className="ac-btn danger"
          type="button"
          onClick={() => onAction("delete")}
        >
          Hapus
          <Icon icon={Trash2} size={15} />
        </button>
      ) : null}
    </div>
  );
}
