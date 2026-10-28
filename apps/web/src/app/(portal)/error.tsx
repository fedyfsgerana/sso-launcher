"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/portal/error-view";

type PortalErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function PortalError({ error, reset }: PortalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorView
      standalone
      code="500"
      label="Terjadi Kesalahan"
      title="Halaman gagal dimuat"
      description="Terjadi kesalahan yang tidak terduga di halaman ini. Menu lain tetap bisa dipakai. Kalau masalahnya berulang, hubungi Administrator Sistem."
      kind="error"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
