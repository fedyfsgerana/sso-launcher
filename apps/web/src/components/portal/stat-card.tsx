"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useCountUp } from "@/lib/portal/use-count-up";
import styles from "./stat-card.module.css";

export type StatTone = "success" | "info" | "warn" | "danger";

type StatCardProps = Readonly<{
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: StatTone;
}>;

export function StatCard({
  icon,
  label,
  value,
  tone = "success",
}: StatCardProps) {
  const shown = useCountUp(value);

  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.icon}>
        <Icon icon={icon} size={20} />
      </span>
      <span className={styles.text}>
        <b aria-hidden="true">{shown}</b>
        <span className="sr-only">{value}</span>
        <small>{label}</small>
      </span>
    </div>
  );
}

export function StatGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className={styles.grid}>{children}</div>;
}
