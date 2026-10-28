"use client";

import { usePathname } from "next/navigation";
import { pageTitle } from "@/lib/portal/page-titles";

export function PageTitle() {
  const pathname = usePathname();

  return <title>{pageTitle(pathname)}</title>;
}
