"use client";

import { use } from "react";
import { ApplicationCredentialsPanel } from "@/components/management/application-credentials-panel";
import { ApplicationSectionPage } from "@/components/management/application-section-page";

type PageProps = Readonly<{
  params: Promise<{ applicationId: string }>;
}>;

export default function ApplicationCredentialsPage({ params }: PageProps) {
  const { applicationId } = use(params);

  return (
    <ApplicationSectionPage
      applicationId={applicationId}
      crumb="Kredensial SSO"
      description="Client ID dan secret yang dipakai server aplikasi untuk memvalidasi token SSO."
    >
      {(application) => (
        <ApplicationCredentialsPanel
          applicationId={applicationId}
          applicationName={application?.name ?? "aplikasi ini"}
          callbackUrl={application?.usesSso ? application.launchUrl : null}
        />
      )}
    </ApplicationSectionPage>
  );
}
