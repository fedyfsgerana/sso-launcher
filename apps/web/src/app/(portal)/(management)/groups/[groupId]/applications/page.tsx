"use client";

import { use } from "react";
import { GroupAccessPanel } from "@/components/management/group-access-panel";
import { GroupSectionPage } from "@/components/management/group-section-page";

type PageProps = Readonly<{
  params: Promise<{ groupId: string }>;
}>;

export default function GroupAccessPage({ params }: PageProps) {
  const { groupId } = use(params);

  return (
    <GroupSectionPage
      groupId={groupId}
      crumb="Akses Aplikasi"
      description="Aplikasi yang bisa dibuka pengguna dalam grup ini."
    >
      {(detail, reload) => (
        <GroupAccessPanel detail={detail} onSaved={reload} />
      )}
    </GroupSectionPage>
  );
}
