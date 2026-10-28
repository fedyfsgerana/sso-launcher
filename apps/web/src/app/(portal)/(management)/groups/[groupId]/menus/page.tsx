"use client";

import { use } from "react";
import { GroupMenuPanel } from "@/components/management/group-menu-panel";
import { GroupSectionPage } from "@/components/management/group-section-page";

type PageProps = Readonly<{
  params: Promise<{ groupId: string }>;
}>;

export default function GroupMenuPage({ params }: PageProps) {
  const { groupId } = use(params);

  return (
    <GroupSectionPage
      groupId={groupId}
      crumb="Akses Menu"
      description="Menu sidebar yang terlihat oleh pengguna dalam grup ini."
    >
      {(detail, reload) => <GroupMenuPanel detail={detail} onSaved={reload} />}
    </GroupSectionPage>
  );
}
