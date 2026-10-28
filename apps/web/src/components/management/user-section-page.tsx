"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SectionPage } from "@/components/portal/section-page";
import { FieldsSkeleton } from "@/components/portal/skeleton";
import { getUser, type PortalUser } from "@/features/users/api";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { Users } from "lucide-react";

type UserSectionPageProps = Readonly<{
  userId: string;
  crumb: string;
  description: string;
  children: (user: PortalUser | null) => ReactNode;
}>;

export function UserSectionPage({
  userId,
  crumb,
  description,
  children,
}: UserSectionPageProps) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getUser(userId)
      .then((result) => {
        if (active) {
          setUser(result);
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
  }, [userId]);

  const showSkeleton = useMinLoading(loading);

  return (
    <SectionPage
      icon={Users}
      loading={showSkeleton}
      parentHref="/users"
      parentLabel="Manajemen Pengguna"
      title={user ? `${crumb} — ${user.name}` : crumb}
      description={description}
    >
      {showSkeleton ? <FieldsSkeleton fields={5} /> : children(user)}
    </SectionPage>
  );
}
