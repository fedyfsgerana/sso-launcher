"use client";

import { use } from "react";
import { GroupForm } from "@/components/management/group-form";

type EditGroupPageProps = Readonly<{
  params: Promise<{ groupId: string }>;
}>;

export default function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = use(params);

  return <GroupForm groupId={groupId} />;
}
