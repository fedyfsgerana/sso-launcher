import Link from "next/link";
import type { ReactNode, SyntheticEvent } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import {
  FieldsSkeleton,
  FormFooterSkeleton,
  PageHeaderSkeleton,
} from "@/components/portal/skeleton";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Icon } from "@/components/ui/icon";

type FormPageProps = Readonly<{
  icon: LucideIcon;
  parentHref: string;
  parentLabel: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  after?: ReactNode;
  errorCount?: number;
  narrow?: boolean;
  loading?: boolean;
  skeletonFields?: number;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}>;

export function FormPage({
  icon,
  parentHref,
  parentLabel,
  title,
  description,
  children,
  footer,
  after,
  errorCount = 0,
  narrow = false,
  loading = false,
  skeletonFields = 6,
  onSubmit,
}: FormPageProps) {
  return (
    <div className="page">
      <form
        className={
          narrow ? "modal-card form-page is-narrow" : "modal-card form-page"
        }
        onSubmit={onSubmit}
      >
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

        {loading ? (
          <FieldsSkeleton fields={skeletonFields} />
        ) : (
          <>
            <FormErrorSummary count={errorCount} />
            <div className="fm-grid">{children}</div>
          </>
        )}

        {loading ? <FormFooterSkeleton /> : <footer>{footer}</footer>}
      </form>

      {loading ? null : after}
    </div>
  );
}
