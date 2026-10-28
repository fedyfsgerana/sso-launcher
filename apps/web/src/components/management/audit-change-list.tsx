import type { AuditChange } from "@/features/audit/api";
import { describeChange } from "@/lib/portal/audit-changes";
import styles from "./audit-change-list.module.css";

type AuditChangeListProps = Readonly<{
  changes: AuditChange[];
}>;

export function AuditChangeList({ changes }: AuditChangeListProps) {
  const views = changes.map(describeChange);

  return (
    <div className={styles.changes}>
      {views.map((change) => (
        <div className={styles.change} key={change.field}>
          <b>{change.label}</b>

          {change.isList &&
          (change.added.length > 0 || change.removed.length > 0) ? (
            <>
              {change.added.length > 0 ? (
                <div className={styles.chips}>
                  {change.added.map((item, index) => (
                    <span
                      className={`${styles.chip} ${styles.added}`}
                      key={`added-${index}`}
                    >
                      + {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {change.removed.length > 0 ? (
                <div className={styles.chips}>
                  {change.removed.map((item, index) => (
                    <span
                      className={`${styles.chip} ${styles.removed}`}
                      key={`removed-${index}`}
                    >
                      − {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.compare}>
              <div className={styles.before}>{change.before}</div>
              <span className={styles.arrow}>→</span>
              <div className={styles.after}>{change.after}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
