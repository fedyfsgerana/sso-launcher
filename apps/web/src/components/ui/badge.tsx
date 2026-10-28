import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger";

type BadgeProps = Readonly<{
  children: ReactNode;
  variant?: BadgeVariant;
}>;

export function Badge({ children, variant = "default" }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
