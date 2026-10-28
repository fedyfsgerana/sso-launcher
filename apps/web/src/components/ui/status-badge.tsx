import type { ReactNode } from "react";
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import {
  ActivateIcon,
  DeactivateIcon,
  statusActionIcon,
} from "@/lib/portal/action-icons";
import { statusLabel, statusTone } from "@/lib/portal/options";
import type { PaletteKey } from "@/lib/portal/palette";

export type BadgeTone =
  | "on"
  | "off"
  | "warn"
  | "danger"
  | "info"
  | "orange"
  | "purple"
  | PaletteKey
  | "mint"
  | "amber";

type BadgeProps = Readonly<{
  tone: BadgeTone;
  icon: LucideIcon;
  title?: string;
  children: ReactNode;
}>;

export function Badge({ tone, icon, title, children }: BadgeProps) {
  return (
    <span className={`status ${tone}`} title={title}>
      <Icon icon={icon} size={13} />
      {children}
    </span>
  );
}

export function ActiveBadge({
  active,
  inactiveLabel = "Nonaktif",
}: Readonly<{ active: boolean; inactiveLabel?: string }>) {
  return active ? (
    <Badge tone="on" icon={ActivateIcon}>
      Aktif
    </Badge>
  ) : (
    <Badge tone="danger" icon={DeactivateIcon}>
      {inactiveLabel}
    </Badge>
  );
}

export function ApplicationStatusBadge({
  status,
}: Readonly<{ status: string }>) {
  return (
    <Badge tone={statusTone(status)} icon={statusActionIcon(status)}>
      {statusLabel(status)}
    </Badge>
  );
}

export function EmptyBadge({
  label = "Belum ada",
}: Readonly<{ label?: string }>) {
  return (
    <Badge tone="off" icon={CircleDashed}>
      {label}
    </Badge>
  );
}

export function CountBadge({
  count,
  unit,
  icon,
  tone,
}: Readonly<{
  count: number;
  unit: string;
  icon: LucideIcon;
  tone: BadgeTone;
}>) {
  if (count <= 0) {
    return <EmptyBadge />;
  }

  return (
    <Badge tone={tone} icon={icon}>
      {count} {unit}
    </Badge>
  );
}

export function GroupBadge({
  children,
  title,
}: Readonly<{ children: ReactNode; title?: string }>) {
  return (
    <Badge tone="purple" icon={UsersRound} title={title}>
      {children}
    </Badge>
  );
}

export function SsoConnectionBadge({
  usesSso,
  credentialCount,
}: Readonly<{ usesSso: boolean; credentialCount: number }>) {
  if (!usesSso) {
    return (
      <Badge tone="off" icon={ExternalLink}>
        Tanpa SSO
      </Badge>
    );
  }

  return credentialCount > 0 ? (
    <Badge tone="on" icon={ShieldCheck}>
      Terhubung
    </Badge>
  ) : (
    <Badge tone="danger" icon={ShieldAlert}>
      Belum terhubung
    </Badge>
  );
}

export function OutcomeBadge({
  failed,
  label,
}: Readonly<{ failed: boolean; label: string }>) {
  return (
    <Badge
      tone={failed ? "danger" : "on"}
      icon={failed ? CircleX : CircleCheck}
    >
      {label}
    </Badge>
  );
}
