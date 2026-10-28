"use client";

import { use } from "react";
import { ApplicationUsersPanel } from "@/components/management/application-users-panel";
import { ApplicationSectionPage } from "@/components/management/application-section-page";

type PageProps = Readonly<{
  params: Promise<{ applicationId: string }>;
}>;

export default function ApplicationUsersPage({ params }: PageProps) {
  const { applicationId } = use(params);

  return (
    <ApplicationSectionPage
      applicationId={applicationId}
      crumb="Pengguna"
      description="Semua pengguna yang bisa membuka aplikasi ini, beserta role dan asal aksesnya."
    >
      {() => <ApplicationUsersPanel applicationId={applicationId} />}
    </ApplicationSectionPage>
  );
}
