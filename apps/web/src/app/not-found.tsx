import { ErrorView } from "@/components/portal/error-view";

export default function NotFound() {
  return (
    <ErrorView
      standalone
      showBack
      code="404"
      label="Error 404"
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda buka tidak ada atau sudah dipindahkan. Periksa kembali alamatnya, atau kembali ke Beranda."
      kind="not-found"
    />
  );
}
