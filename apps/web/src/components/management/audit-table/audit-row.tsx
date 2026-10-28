"use client";

import { Icon } from "@/components/ui/icon";
import type { AuditLog } from "@/features/audit/api";
import {
  actionIcon,
  actionLabel,
  actionTone,
  describeDevice,
  moduleLabel,
  targetColorClass,
  targetIcon,
  targetLabel,
} from "@/lib/portal/audit-options";
import { formatRelative, initials } from "@/lib/portal/format";
import { avatarColorClass } from "@/lib/portal/palette";

type AuditRowProps = Readonly<{
  log: AuditLog;
  number: number;
  onOpen: () => void;
}>;

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AuditRow({ log, number, onOpen }: AuditRowProps) {
  const device =
    [log.deviceName, describeDevice(log)].filter(Boolean).join(" · ") || "-";

  return (
    <tr
      tabIndex={0}
      style={{ cursor: "pointer" }}
      title="Lihat detail aktivitas"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <td className="ta-c">
        <span className="row-no">{number}</span>
      </td>

      <td>
        <div className="who">
          <span className={`av ${avatarColorClass(log.actorName)}`}>
            {initials(log.actorName)}
          </span>
          <div>
            <b>{log.actorName}</b>
            <small className="sm-only">{targetLabel(log.targetType)}</small>
          </div>
        </div>
      </td>

      <td>
        <span className={`status ${actionTone(log.action, log.outcome)}`}>
          <Icon icon={actionIcon(log.action)} size={13} />
          {actionLabel(log.action)}
        </span>
      </td>

      <td className="hs">
        <div className="who">
          <span className={`rc-ic sm ${targetColorClass(log.targetType)}`}>
            <Icon icon={targetIcon(log.targetType)} />
          </span>
          <div>
            <b>{log.targetName || "-"}</b>
            <small>
              {moduleLabel(log.module)} · {targetLabel(log.targetType)}
            </small>
          </div>
        </div>
      </td>

      <td className="muted hs">
        {log.summary || "-"}
        {log.reason ? (
          <>
            <br />
            <small>Alasan: {log.reason}</small>
          </>
        ) : null}
        {log.hasChanges ? (
          <>
            <br />
            <small>Ada detail perubahan</small>
          </>
        ) : null}
      </td>

      <td className="hs">
        <div className="who">
          <div>
            <b>{log.ipAddress ?? "-"}</b>
            <small>{device}</small>
          </div>
        </div>
      </td>

      <td className="ta-r">
        <span
          className="muted"
          title={dateTime.format(new Date(log.occurredAt))}
        >
          {formatRelative(log.occurredAt)}
        </span>
      </td>
    </tr>
  );
}
