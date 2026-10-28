"use client";

import { use } from "react";
import { GroupMembersPanel } from "@/components/management/group-members-panel";
import { GroupSectionPage } from "@/components/management/group-section-page";

type PageProps = Readonly<{
  params: Promise<{ groupId: string }>;
}>;

export default function GroupMembersPage({ params }: PageProps) {
  const { groupId } = use(params);

  return (
    <GroupSectionPage
      groupId={groupId}
      crumb="Pengguna"
      description="Pilih pengguna yang tergabung di grup ini."
    >
      {(detail, reload) => (
        <GroupMembersPanel detail={detail} onSaved={reload} />
      )}
    </GroupSectionPage>
  );
}
