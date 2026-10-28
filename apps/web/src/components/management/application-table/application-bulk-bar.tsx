"use client";

import { Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { ApplicationStatus } from "@/features/applications/application-status";
import type { ApplicationBulkAction } from "@/features/applications/use-application-actions";
import {
  statusActionIcon,
  statusActionLabel,
  statusActionTone,
} from "@/lib/portal/action-icons";
import { STATUS_OPTIONS } from "@/lib/portal/options";

type ApplicationBulkBarProps = Readonly<{
  count: number;
  canUpdate: boolean;
  canDelete: boolean;
  onAction: (action: ApplicationBulkAction) => void;
}>;

export function ApplicationBulkBar({
  count,
  canUpdate,
  canDelete,
  onAction,
}: ApplicationBulkBarProps) {
  return (
    <div className="bulk">
      <span>{count} aplikasi dipilih</span>

      {canUpdate
        ? STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`ac-btn ${statusActionTone(option.value)}`}
              type="button"
              onClick={() => onAction(option.value as ApplicationStatus)}
            >
              {statusActionLabel(option.value)}
              <Icon icon={statusActionIcon(option.value)} size={15} />
            </button>
          ))
        : null}

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
