"use client";

import type { ReactNode } from "react";
import { AppStateDot } from "@/components/portal/app-state-dot";
import { CategoryBadge } from "@/components/portal/category-badge";
import { Icon } from "@/components/ui/icon";
import { resolveIcon } from "@/lib/icons";
import { formatRelative } from "@/lib/portal/format";
import type { PortalActivity, PortalApplication } from "@/types/portal";

const KIND = { label: "Aplikasi", icon: "grid" } as const;

type ActivityRowProps = Readonly<{
  activity: PortalActivity;
  application?: PortalApplication;
  compact?: boolean;
  onOpen?: (activity: PortalActivity) => void;
  actions?: ReactNode;
  select?: ReactNode;
  number?: number;
  selected?: boolean;
}>;

export function ActivityRow({
  activity,
  application,
  compact = false,
  onOpen,
  actions,
  select,
  number,
  selected = false,
}: ActivityRowProps) {
  const iconName = application?.icon ?? KIND.icon;
  const tone = application ? application.color : "soft";
  const time = formatRelative(activity.occurredAt);

  const clickable = Boolean(onOpen);

  return (
    <div
      className={[
        "rc-row",
        compact ? "compact" : "",
        select ? "selectable" : "",
        selected ? "sel" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen?.(activity) : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter") {
                onOpen?.(activity);
              }
            }
          : undefined
      }
    >
      {select ? (
        <div
          className="rc-ck"
          role="presentation"
          onClick={(event) => event.stopPropagation()}
        >
          {select}
        </div>
      ) : null}

      {select && number !== undefined ? (
        <div className="rc-no">{number}</div>
      ) : null}

      <div className="rc-name">
        <span className="ac-logo-wrap">
          <span className={`rc-ic ${tone}`}>
            <Icon icon={resolveIcon(iconName)} />
          </span>
          {application ? <AppStateDot application={application} /> : null}
        </span>
        <div>
          <span className="ac-title">
            <b>{activity.title}</b>
            <CategoryBadge
              label={application?.category || KIND.label}
              warn={application?.status === "maintenance"}
            />
          </span>
          <small>
            {activity.subtitle}
            <span className="rc-mob"> · {time}</span>
          </small>
        </div>
      </div>

      <div className="rc-time">{time}</div>

      {compact || !actions ? null : (
        <div
          className="rc-act row-acts"
          role="presentation"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
