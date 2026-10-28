"use client";

import { use } from "react";
import { UserForm } from "@/components/management/user-form";

type EditUserPageProps = Readonly<{
  params: Promise<{ userId: string }>;
}>;

export default function EditUserPage({ params }: EditUserPageProps) {
  const { userId } = use(params);

  return <UserForm userId={userId} />;
}
