"use client";

import { use } from "react";
import { UserSecurityPanel } from "@/components/management/user-security-panel";
import { UserSectionPage } from "@/components/management/user-section-page";

type PageProps = Readonly<{
  params: Promise<{ userId: string }>;
}>;

export default function UserKeamananPage({ params }: PageProps) {
  const { userId } = use(params);

  return (
    <UserSectionPage
      userId={userId}
      crumb="Keamanan"
      description="Atur ulang password dan kelola sesi login pengguna."
    >
      {(user) => <UserSecurityPanel userId={userId} user={user} />}
    </UserSectionPage>
  );
}
