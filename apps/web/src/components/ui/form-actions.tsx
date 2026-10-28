import type { ReactNode } from "react";

type FormActionsProps = Readonly<{
  children: ReactNode;
}>;

export function FormActions({ children }: FormActionsProps) {
  return <div className="form-actions">{children}</div>;
}
