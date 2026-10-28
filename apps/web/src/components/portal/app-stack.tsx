import { Icon } from "@/components/ui/icon";
import { resolveIcon } from "@/lib/icons";
import { initials } from "@/lib/portal/format";
import styles from "./app-stack.module.css";

type StackApplication = Readonly<{
  id: string;
  name: string;
  icon?: string | null;
  color: string;
}>;

type AppStackProps = Readonly<{
  applications: readonly StackApplication[];
  label: string;
  limit?: number;
}>;

export function AppStack({ applications, label, limit = 4 }: AppStackProps) {
  const shown = applications.slice(0, limit);
  const rest = applications.length - shown.length;

  return (
    <span className={styles.stack}>
      {shown.length > 0 ? (
        <span className={styles.logos} aria-hidden="true">
          {shown.map((application) => (
            <span
              key={application.id}
              className={`${styles.logo} ${application.color}`}
            >
              {application.icon ? (
                <Icon icon={resolveIcon(application.icon)} size={13} />
              ) : (
                <b>{initials(application.name).slice(0, 1)}</b>
              )}
            </span>
          ))}
          {rest > 0 ? <span className={styles.more}>+{rest}</span> : null}
        </span>
      ) : null}
      <span className={styles.count}>{label}</span>
    </span>
  );
}
