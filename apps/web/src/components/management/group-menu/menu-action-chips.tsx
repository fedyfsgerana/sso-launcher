"use client";

import {
  ArrowUpDown,
  Check,
  CircleCheck,
  Copy,
  Download,
  History,
  Key,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { MenuActionDefinition } from "@/features/menus/admin-api";
import { actionTone } from "@/lib/portal/action-tone";
import styles from "./group-menu.module.css";

const ACTION_ICONS: Readonly<Record<string, LucideIcon>> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  reset_password: KeyRound,
  revoke_sessions: LogOut,
  duplicate: Copy,
  manage_members: Users,
  manage_access: ShieldCheck,
  manage_credentials: Key,
  reorder: ArrowUpDown,
  maintenance: Wrench,
  export: Download,
  restore: RotateCcw,
  rollback: History,
};

type MenuActionChipsProps = Readonly<{
  available: readonly MenuActionDefinition[];
  indent?: number;
  inline?: boolean;
  isGranted: (key: string) => boolean;
  onToggle: (keys: readonly string[], checked: boolean) => void;
}>;

export function MenuActionChips({
  available,
  indent = 0,
  inline = false,
  isGranted,
  onToggle,
}: MenuActionChipsProps) {
  const allGranted = available.every((item) => isGranted(item.key));

  return (
    <div
      className={
        inline ? `${styles.chips} ${styles.chipsInline}` : styles.chips
      }
      style={inline ? undefined : { paddingLeft: 34 + indent }}
    >
      <button
        className={styles.chip}
        type="button"
        aria-pressed={allGranted}
        onClick={() =>
          onToggle(
            available.map((item) => item.key),
            !allGranted,
          )
        }
      >
        {allGranted ? <Icon icon={Check} size={13} /> : null}
        Semua aksi
      </button>

      {available.map((item) => {
        const active = isGranted(item.key);

        return (
          <button
            key={item.key}
            className={`${styles.chip} tone-${actionTone(item.key)}`}
            type="button"
            aria-pressed={active}
            title={item.description}
            onClick={() => onToggle([item.key], !active)}
          >
            <Icon
              icon={active ? Check : (ACTION_ICONS[item.key] ?? CircleCheck)}
              size={13}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
