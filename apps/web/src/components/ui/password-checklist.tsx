import { Circle, CircleCheck } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { passwordChecks } from "@/lib/portal/password-rules";
import styles from "./password-checklist.module.css";

export function PasswordChecklist({ value }: Readonly<{ value: string }>) {
  return (
    <span className={styles.list} aria-live="polite">
      {passwordChecks(value).map((check) => (
        <span
          key={check.key}
          className={check.ok ? `${styles.item} ${styles.ok}` : styles.item}
        >
          <Icon icon={check.ok ? CircleCheck : Circle} size={14} />
          {check.label}
        </span>
      ))}
    </span>
  );
}
