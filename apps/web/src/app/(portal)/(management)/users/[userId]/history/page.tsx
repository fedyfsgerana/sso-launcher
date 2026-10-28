"use client";

import { use } from "react";
import { UserHistoryPanel } from "@/components/management/user-history-panel";
import { UserSectionPage } from "@/components/management/user-section-page";

type PageProps = Readonly<{
  params: Promise<{ userId: string }>;
}>;

export default function UserHistoryPage({ params }: PageProps) {
  const { userId } = use(params);

  return (
    <UserSectionPage
      userId={userId}
      crumb="Riwayat"
      description="Semua perubahan yang pernah dilakukan pada pengguna ini."
    >
      {() => <UserHistoryPanel userId={userId} />}
    </UserSectionPage>
  );
}
