"use client";

import { Lock, Star, StarOff } from "lucide-react";
import { AppStateDot } from "@/components/portal/app-state-dot";
import { CategoryBadge } from "@/components/portal/category-badge";
import { MaintenanceTip } from "@/components/portal/maintenance-tip";
import { useHoverTip } from "@/components/ui/hover-tip";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/portal/toast";
import { resolveIcon } from "@/lib/icons";
import { initials } from "@/lib/portal/format";
import type { PortalApplication } from "@/types/portal";

type ApplicationCardProps = Readonly<{
  application: PortalApplication;
  locked?: boolean;
  onOpen?: (application: PortalApplication) => void;
  onToggleFavorite?: (applicationId: string) => void;
}>;

export function ApplicationCard({
  application,
  locked = false,
  onOpen,
  onToggleFavorite,
}: ApplicationCardProps) {
  const { showToast } = useToast();
  const tip = useHoverTip();

  const maintenance = application.status === "maintenance";
  const disabled = locked || application.status !== "active";

  function activate() {
    if (locked) {
      showToast(`Permintaan akses ${application.name} terkirim`);
      return;
    }

    onOpen?.(application);
  }

  return (
    <>
      <article
        {...(maintenance ? tip.triggerProps : {})}
        className={[
          "ac",
          locked ? "is-locked" : "",
          maintenance ? "is-maintenance" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          className="ac-hit"
          type="button"
          disabled={disabled && !locked}
          aria-label={
            locked
              ? `Minta akses ${application.name}`
              : `Buka ${application.name}`
          }
          onClick={activate}
        >
          <span className="ac-logo-wrap">
            <span className={`ac-logo ${application.color}`}>
              {application.icon ? (
                <Icon icon={resolveIcon(application.icon)} size={24} />
              ) : (
                <b className="ac-mono">{initials(application.name)}</b>
              )}
            </span>
            <AppStateDot application={application} />
          </span>

          <span className="ac-txt">
            <span className="ac-title">
              <b>{application.name}</b>
              {application.category ? (
                <CategoryBadge
                  label={application.category}
                  warn={maintenance}
                />
              ) : null}
            </span>
            <small>{application.description}</small>

            {locked ? (
              <em className="ac-note">
                <Icon icon={Lock} size={13} />
                Belum punya akses
              </em>
            ) : null}
          </span>
        </button>

        {locked || !onToggleFavorite ? null : (
          <button
            className={application.isFavorite ? "star on" : "star"}
            type="button"
            aria-pressed={application.isFavorite}
            aria-label={`${
              application.isFavorite ? "Hapus dari" : "Tambah ke"
            } favorit`}
            onClick={() => onToggleFavorite(application.id)}
          >
            <Icon icon={application.isFavorite ? StarOff : Star} size={18} />
          </button>
        )}
      </article>

      {maintenance ? (
        <MaintenanceTip
          id={tip.id}
          placement={tip.placement}
          leaving={tip.leaving}
          name={application.name}
          message={application.maintenanceMessage}
        />
      ) : null}
    </>
  );
}
