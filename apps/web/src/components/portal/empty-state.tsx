import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyIllustration } from "@/components/portal/empty-illustration";

type EmptyStateProps = Readonly<{
  badge?: LucideIcon;
  title: string;
  description: string;
  inPanel?: boolean;
  action?: ReactNode;
}>;

export function EmptyState({
  badge,
  title,
  description,
  inPanel = false,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={inPanel ? "empty" : "card empty"}
      style={inPanel ? { gridColumn: "1 / -1" } : undefined}
    >
      <EmptyIllustration badge={badge} />
      <b>{title}</b>
      {description}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
