import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/portal-shell";

type PortalLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function PortalLayout({ children }: PortalLayoutProps) {
  return <PortalShell>{children}</PortalShell>;
}
