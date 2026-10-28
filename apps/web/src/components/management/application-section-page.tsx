"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SectionPage } from "@/components/portal/section-page";
import { FieldsSkeleton } from "@/components/portal/skeleton";
import {
  getAdminApplications,
  type AdminApplication,
} from "@/features/applications/admin-api";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { AppWindow } from "lucide-react";

type ApplicationSectionPageProps = Readonly<{
  applicationId: string;
  crumb: string;
  description: string;
  children: (application: AdminApplication | null) => ReactNode;
}>;

export function ApplicationSectionPage({
  applicationId,
  crumb,
  description,
  children,
}: ApplicationSectionPageProps) {
  const [application, setApplication] = useState<AdminApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getAdminApplications()
      .then((list) => {
        if (active) {
          setApplication(
            list.find((item) => item.id === applicationId) ?? null,
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applicationId]);

  const showSkeleton = useMinLoading(loading);

  return (
    <SectionPage
      icon={AppWindow}
      loading={showSkeleton}
      parentHref="/applications"
      parentLabel="Manajemen Aplikasi"
      title={application ? `${crumb} — ${application.name}` : crumb}
      description={description}
    >
      {showSkeleton ? <FieldsSkeleton fields={4} /> : children(application)}
    </SectionPage>
  );
}
