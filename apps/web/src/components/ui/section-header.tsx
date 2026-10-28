import type { ReactNode } from "react";

type SectionHeaderProps = Readonly<{
  title: string;
  description?: string;
  action?: ReactNode;
}>;

export function SectionHeader({
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );
}
