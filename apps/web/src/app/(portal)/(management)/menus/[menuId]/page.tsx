"use client";

import { use } from "react";
import { MenuForm } from "@/components/management/menu-form";

type EditMenuPageProps = Readonly<{
  params: Promise<{ menuId: string }>;
}>;

export default function EditMenuPage({ params }: EditMenuPageProps) {
  const { menuId } = use(params);

  return <MenuForm menuId={menuId} />;
}
