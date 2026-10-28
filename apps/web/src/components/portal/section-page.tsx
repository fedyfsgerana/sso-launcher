import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { PageHeaderSkeleton } from "@/components/portal/skeleton";
import { Icon } from "@/components/ui/icon";

type SectionPageProps = Readonly<{
  icon: LucideIcon;
  parentHref: string;
  parentLabel: string;
  title: string;
  description: string;
  children: ReactNode;
  loading?: boolean;
}>;

export function SectionPage({
  icon,
  parentHref,
  parentLabel,
  title,
  description,
  children,
  loading = false,
}: SectionPageProps) {
  return (
    <div className="page">
      <section className="modal-card form-page ua-card">
        {loading ? (
          <PageHeaderSkeleton />
        ) : (
          <header>
            <span className="mh-ic">
              <Icon icon={icon} size={20} />
            </span>

            <div>
              <h3 title={title}>{title}</h3>
              <p>{description}</p>
            </div>

            <Link
              className="ac-btn ghost back-link"
              href={parentHref}
              title={`Kembali ke ${parentLabel}`}
            >
              <Icon icon={ArrowLeft} size={16} />
              Kembali
            </Link>
          </header>
        )}

        {children}
      </section>
    </div>
  );
}
