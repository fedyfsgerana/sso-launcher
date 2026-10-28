"use client";

import {
  Key,
  Pencil,
  SquareArrowOutUpRight,
  Trash2,
  Users,
} from "lucide-react";
import {
  ApplicationStatusBadge,
  CountBadge,
  SsoConnectionBadge,
} from "@/components/ui/status-badge";
import { PickCheck } from "@/components/management/pick-check";
import { Icon } from "@/components/ui/icon";
import {
  RowActionMenu,
  type RowActionItem,
} from "@/components/ui/row-action-menu";
import type { AdminApplication } from "@/features/applications/admin-api";
import type { ApplicationStatus } from "@/features/applications/application-status";
import { resolveIcon } from "@/lib/icons";
import {
  statusActionIcon,
  statusActionLabel,
  statusActionTone,
} from "@/lib/portal/action-icons";
import { initials } from "@/lib/portal/format";
import { STATUS_OPTIONS } from "@/lib/portal/options";
import { useAppRouter } from "@/lib/portal/use-app-router";

type ApplicationRowProps = Readonly<{
  application: AdminApplication;
  number: number;
  selected: boolean;
  can: (actionKey: string) => boolean;
  onSelect: (checked: boolean) => void;
  onChangeStatus: (next: ApplicationStatus) => void;
  onRemove: () => void;
}>;

function rowClassName(application: AdminApplication, selected: boolean) {
  return [
    selected ? "sel" : "",
    application.status === "maintenance" ? "row-warn" : "",
    application.status === "inactive" ? "row-danger" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ApplicationRow({
  application,
  number,
  selected,
  can,
  onSelect,
  onChangeStatus,
  onRemove,
}: ApplicationRowProps) {
  const router = useAppRouter();

  const items: Array<RowActionItem | false> = [
    can("update") && {
      key: "edit",
      label: "Ubah",
      icon: Pencil,
      tone: "primary",
      onSelect: () => router.push(`/applications/${application.id}`),
    },
    can("manage_credentials") && {
      key: "credentials",
      label: "Kredensial SSO",
      icon: Key,
      tone: "info",
      onSelect: () =>
        router.push(`/applications/${application.id}/credentials`),
    },
    {
      key: "users",
      label: "Pengguna Aplikasi",
      icon: Users,
      tone: "info",
      onSelect: () => router.push(`/applications/${application.id}/users`),
    },
    {
      key: "open",
      label: "Buka URL Aplikasi",
      icon: SquareArrowOutUpRight,
      tone: "info",
      onSelect: () => {
        window.open(
          application.appUrl || application.launchUrl,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    ...(can("update")
      ? STATUS_OPTIONS.filter(
          (option) => option.value !== application.status,
        ).map(
          (option): RowActionItem => ({
            key: `status-${option.value}`,
            label: statusActionLabel(option.value),
            icon: statusActionIcon(option.value),
            tone: statusActionTone(option.value),
            onSelect: () => onChangeStatus(option.value as ApplicationStatus),
          }),
        )
      : []),
    can("delete") && {
      key: "delete",
      label: "Hapus",
      icon: Trash2,
      tone: "danger",
      onSelect: onRemove,
    },
  ];

  return (
    <tr className={rowClassName(application, selected)}>
      <td className="ck">
        <PickCheck
          label={`Pilih ${application.name}`}
          checked={selected}
          onChange={onSelect}
        />
      </td>

      <td className="ta-c">
        <span className="row-no">{number}</span>
      </td>

      <td>
        <div className="who">
          <span className={`rc-ic ${application.color}`}>
            {application.icon ? (
              <Icon icon={resolveIcon(application.icon)} />
            ) : (
              <b className="ac-mono">{initials(application.name)}</b>
            )}
          </span>
          <div>
            <b>{application.name}</b>
            <small>{application.slug}</small>
          </div>
        </div>
      </td>

      <td className="hs">{application.category || "-"}</td>

      <td className="hs">
        <code className="path">{application.launchUrl}</code>
      </td>

      <td className="hs">
        <CountBadge
          count={application.userCount}
          unit="pengguna"
          icon={Users}
          tone="slate"
        />
      </td>

      <td className="hs">
        <SsoConnectionBadge
          usesSso={application.usesSso}
          credentialCount={application.credentialCount}
        />
      </td>

      <td>
        <ApplicationStatusBadge status={application.status} />
      </td>

      <td className="ta-r">
        <div className="row-acts">
          <RowActionMenu
            label={`Aksi untuk ${application.name}`}
            items={items}
          />
        </div>
      </td>
    </tr>
  );
}
