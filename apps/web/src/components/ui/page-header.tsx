import type { ReactNode } from "react";

type PageHeaderProps = Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
  );
}
