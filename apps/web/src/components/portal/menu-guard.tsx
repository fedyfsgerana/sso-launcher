"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorView } from "@/components/portal/error-view";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { canOpenPath, maintenanceFor } from "@/lib/portal/menu-access";

const ALWAYS_ALLOWED = ["", "profile", "settings", "launch"];

type MenuGuardProps = Readonly<{
  children: ReactNode;
}>;

export function MenuGuard({ children }: MenuGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: sessionLoading } = useAuthSession();
  const { menus, loading: menuLoading } = usePortalData();

  const loading = sessionLoading || menuLoading;
  const segment = pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
  const guarded = !ALWAYS_ALLOWED.includes(segment);

  useEffect(() => {
    if (loading || user) {
      return;
    }

    router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return guarded ? <div className="error-screen" /> : null;
  }

  if (guarded && !canOpenPath(menus, pathname)) {
    return (
      <ErrorView
        standalone
        showBack
        code="403"
        label="Error 403"
        title="Akses ditolak"
        description="Anda tidak memiliki akses ke halaman ini. Kalau Anda membutuhkannya untuk pekerjaan, hubungi Administrator Sistem agar menu ini ditambahkan ke grup Anda."
        kind="forbidden"
      />
    );
  }

  if (guarded) {
    const maintenance = maintenanceFor(menus, pathname);

    if (maintenance) {
      return (
        <ErrorView
          standalone
          showBack
          code="503"
          label="Sedang Dalam Perbaikan"
          title={maintenance.title}
          description={maintenance.message}
          kind="maintenance"
        />
      );
    }
  }

  return children;
}
