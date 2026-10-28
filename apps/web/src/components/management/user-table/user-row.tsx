"use client";

import { History, KeyRound, Pencil, Trash2 } from "lucide-react";
import {
  ActiveBadge,
  EmptyBadge,
  GroupBadge,
} from "@/components/ui/status-badge";
import { PickCheck } from "@/components/management/pick-check";
import {
  RowActionMenu,
  type RowActionItem,
} from "@/components/ui/row-action-menu";
import type { PortalUser } from "@/features/users/api";
import { activeActionIcon, activeActionLabel } from "@/lib/portal/action-icons";
import { departmentLabel, initials } from "@/lib/portal/format";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { avatarColorClass } from "@/lib/portal/palette";

type UserRowProps = Readonly<{
  user: PortalUser;
  number: number;
  selected: boolean;
  can: (actionKey: string) => boolean;
  onSelect: (checked: boolean) => void;
  onToggleActive: () => void;
  onRemove: () => void;
}>;

function GroupTags({ groups }: Readonly<{ groups: PortalUser["groups"] }>) {
  if (groups.length === 0) {
    return <EmptyBadge />;
  }

  return (
    <span className="grp-tags">
      <GroupBadge>{groups[0].name}</GroupBadge>
      {groups.length > 1 ? (
        <GroupBadge
          title={groups
            .slice(1)
            .map((group) => group.name)
            .join(", ")}
        >
          +{groups.length - 1}
        </GroupBadge>
      ) : null}
    </span>
  );
}

export function UserRow({
  user,
  number,
  selected,
  can,
  onSelect,
  onToggleActive,
  onRemove,
}: UserRowProps) {
  const router = useAppRouter();
  const department = user.departemenCode ?? user.department;

  const items: Array<RowActionItem | false> = [
    can("update") && {
      key: "edit",
      label: "Ubah",
      icon: Pencil,
      tone: "primary",
      onSelect: () => router.push(`/users/${user.id}`),
    },
    (can("reset_password") || can("revoke_sessions")) && {
      key: "security",
      label: "Keamanan",
      icon: KeyRound,
      tone: "warn",
      onSelect: () => router.push(`/users/${user.id}/security`),
    },
    {
      key: "history",
      label: "Riwayat",
      icon: History,
      tone: "info",
      onSelect: () => router.push(`/users/${user.id}/history`),
    },
    can("update") && {
      key: "active",
      label: activeActionLabel(user.isActive),
      icon: activeActionIcon(user.isActive),
      tone: user.isActive ? "danger" : "success",
      onSelect: onToggleActive,
    },
    can("delete") && {
      key: "delete",
      label: "Hapus",
      icon: Trash2,
      tone: "danger",
      onSelect: onRemove,
    },
  ];

  return (
    <tr
      className={[selected ? "sel" : "", user.isActive ? "" : "row-danger"]
        .filter(Boolean)
        .join(" ")}
    >
      <td className="ck">
        <PickCheck
          label={`Pilih ${user.name}`}
          checked={selected}
          onChange={onSelect}
        />
      </td>

      <td className="ta-c">
        <span className="row-no">{number}</span>
      </td>

      <td>
        <div className="who">
          <span className={`av ${avatarColorClass(user.name)}`}>
            {initials(user.name)}
          </span>
          <div>
            <span className="who-line">
              <b>{user.name}</b>
            </span>
            <small>
              {user.jobTitle ?? "-"}
              <span className="sm-only">
                {user.departemenCode || user.department
                  ? ` · ${department}`
                  : ""}
              </span>
            </small>
          </div>
        </div>
      </td>

      <td className="mono hs">{user.employeeNumber ?? "-"}</td>
      <td className="muted hs">{user.email}</td>
      <td className="hs">
        {departmentLabel(user.department, user.departemenCode)}
      </td>
      <td className="hs">
        <GroupTags groups={user.groups} />
      </td>

      <td>
        <ActiveBadge active={user.isActive} />
      </td>

      <td className="ta-r">
        <div className="row-acts">
          <RowActionMenu label={`Aksi untuk ${user.name}`} items={items} />
        </div>
      </td>
    </tr>
  );
}
