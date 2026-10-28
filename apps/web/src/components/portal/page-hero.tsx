import type { ReactNode } from "react";
import { RingsArt } from "@/components/portal/rings-art";

type PageHeroProps = Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function PageHero({ title, description, actions }: PageHeroProps) {
  return (
    <section className="hero hero-page">
      <div className="hero-copy">
        <div className="eyebrow">
          <i className="rule" />
          PACIFIC PORTAL
        </div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>

      {actions ? <div className="hero-actions">{actions}</div> : null}

      <RingsArt />
    </section>
  );
}
