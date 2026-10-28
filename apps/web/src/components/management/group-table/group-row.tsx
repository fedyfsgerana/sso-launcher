"use client";

import {
  AppWindow,
  Copy,
  Pencil,
  SquareMenu,
  Trash2,
  Users,
  UsersRound,
} from "lucide-react";
import { ActiveBadge, CountBadge } from "@/components/ui/status-badge";
import { PickCheck } from "@/components/management/pick-check";
import { Icon } from "@/components/ui/icon";
import {
  RowActionMenu,
  type RowActionItem,
} from "@/components/ui/row-action-menu";
import type { UserGroup } from "@/features/groups/api";
import { activeActionIcon, activeActionLabel } from "@/lib/portal/action-icons";
import { departmentLabel } from "@/lib/portal/format";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { avatarColorClass } from "@/lib/portal/palette";

type GroupRowProps = Readonly<{
  group: UserGroup;
  number: number;
  selected: boolean;
  can: (actionKey: string) => boolean;
  onSelect: (checked: boolean) => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}>;

export function GroupRow({
  group,
  number,
  selected,
  can,
  onSelect,
  onDuplicate,
  onToggleActive,
  onRemove,
}: GroupRowProps) {
  const router = useAppRouter();

  const items: Array<RowActionItem | false> = [
    can("update") && {
      key: "edit",
      label: "Ubah",
      icon: Pencil,
      tone: "primary",
      onSelect: () => router.push(`/groups/${group.id}`),
    },
    can("manage_members") && {
      key: "members",
      label: "Kelola Pengguna",
      icon: Users,
      tone: "info",
      onSelect: () => router.push(`/groups/${group.id}/members`),
    },
    can("manage_access") && {
      key: "apps",
      label: "Akses Aplikasi",
      icon: AppWindow,
      tone: "info",
      onSelect: () => router.push(`/groups/${group.id}/applications`),
    },
    can("manage_access") && {
      key: "menus",
      label: "Akses Menu",
      icon: SquareMenu,
      tone: "info",
      onSelect: () => router.push(`/groups/${group.id}/menus`),
    },
    can("duplicate") && {
      key: "duplicate",
      label: "Duplikat Grup",
      icon: Copy,
      tone: "success",
      onSelect: onDuplicate,
    },
    can("update") && {
      key: "active",
      label: activeActionLabel(group.isActive),
      icon: activeActionIcon(group.isActive),
      tone: group.isActive ? "danger" : "success",
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
      className={[selected ? "sel" : "", group.isActive ? "" : "row-danger"]
        .filter(Boolean)
        .join(" ")}
    >
      <td className="ck">
        <PickCheck
          label={`Pilih ${group.name}`}
          checked={selected}
          onChange={onSelect}
        />
      </td>

      <td className="ta-c">
        <span className="row-no">{number}</span>
      </td>

      <td>
        <div className="who">
          <span className={`rc-ic ${avatarColorClass(group.name)}`}>
            <Icon icon={UsersRound} />
          </span>
          <div>
            <b>{group.name}</b>
            <small className="sm-only">
              {group.departemenCode ? `${group.departemenCode} · ` : ""}
              {group.memberCount} pengguna
            </small>
          </div>
        </div>
      </td>

      <td className="muted hs">
        {departmentLabel(group.department, group.departemenCode)}
      </td>
      <td className="muted hs">{group.description || "-"}</td>
      <td className="hs">
        <CountBadge
          count={group.memberCount}
          unit="pengguna"
          icon={Users}
          tone="slate"
        />
      </td>
      <td className="hs">
        <CountBadge
          count={group.applicationCount}
          unit="aplikasi"
          icon={AppWindow}
          tone="info"
        />
      </td>
      <td className="hs">
        <CountBadge
          count={group.menuCount}
          unit="menu"
          icon={SquareMenu}
          tone="orange"
        />
      </td>

      <td>
        <ActiveBadge active={group.isActive} />
      </td>

      <td className="ta-r">
        <div className="row-acts">
          <RowActionMenu label={`Aksi untuk ${group.name}`} items={items} />
        </div>
      </td>
    </tr>
  );
}
