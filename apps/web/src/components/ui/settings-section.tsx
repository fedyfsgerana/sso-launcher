import type { ReactNode } from "react";

type SettingsSectionProps = Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
}>;

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="settings-card">
      <div className="settings-card-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {children}
    </section>
  );
}
