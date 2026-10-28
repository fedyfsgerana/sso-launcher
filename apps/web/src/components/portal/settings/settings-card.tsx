import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import styles from "./settings.module.css";

type SettingsCardProps = Readonly<{
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: string;
}>;

export function SettingsCard({
  title,
  icon,
  subtitle,
  action,
  children,
  className,
  tone,
}: SettingsCardProps) {
  return (
    <section className={`card ${styles.card} ${className ?? ""}`}>
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <i className={tone ? `ch-ic ${tone}` : "ch-ic"}>
            <Icon icon={icon} size={18} />
          </i>
          <div>
            <h3>{title}</h3>
            {subtitle ? <small>{subtitle}</small> : null}
          </div>
        </div>
        {action}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
