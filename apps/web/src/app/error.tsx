"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/portal/error-view";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorView
      standalone
      code="500"
      label="Terjadi Kesalahan"
      title="Halaman gagal dimuat"
      description="Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman ini. Kalau masalahnya berulang, hubungi Administrator Sistem."
      kind="error"
      reference={error.digest}
      onRetry={reset}
    />
  );
}
