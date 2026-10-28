"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SectionPage } from "@/components/portal/section-page";
import { FieldsSkeleton } from "@/components/portal/skeleton";
import { getGroupDetail, type UserGroupDetail } from "@/features/groups/api";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { UsersRound } from "lucide-react";

type GroupSectionPageProps = Readonly<{
  groupId: string;
  crumb: string;
  description: string;
  children: (detail: UserGroupDetail, reload: () => void) => ReactNode;
}>;

export function GroupSectionPage({
  groupId,
  crumb,
  description,
  children,
}: GroupSectionPageProps) {
  const [detail, setDetail] = useState<UserGroupDetail | null>(null);

  const reload = useCallback(() => {
    void getGroupDetail(groupId)
      .then(setDetail)
      .catch(() => undefined);
  }, [groupId]);

  useEffect(() => {
    let active = true;

    void getGroupDetail(groupId)
      .then((value) => {
        if (active) {
          setDetail(value);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [groupId]);

  const showSkeleton = useMinLoading(!detail);

  return (
    <SectionPage
      icon={UsersRound}
      loading={showSkeleton}
      parentHref="/groups"
      parentLabel="Manajemen Grup & Akses"
      title={detail ? `${crumb} — ${detail.name}` : crumb}
      description={description}
    >
      {showSkeleton || !detail ? (
        <FieldsSkeleton fields={5} />
      ) : (
        children(detail, reload)
      )}
    </SectionPage>
  );
}
