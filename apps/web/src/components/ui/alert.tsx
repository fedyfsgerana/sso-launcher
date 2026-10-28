import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = Readonly<{
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
}>;

export function Alert({ title, children, variant = "info" }: AlertProps) {
  return (
    <div
      className={`alert alert-${variant}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}
