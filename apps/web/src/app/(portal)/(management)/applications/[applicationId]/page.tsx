"use client";

import { use } from "react";
import { ApplicationForm } from "@/components/management/application-form";

type EditApplicationPageProps = Readonly<{
  params: Promise<{ applicationId: string }>;
}>;

export default function EditApplicationPage({
  params,
}: EditApplicationPageProps) {
  const { applicationId } = use(params);

  return <ApplicationForm applicationId={applicationId} />;
}
