export const APP_NAME = "SSO Launcher";

const TITLE_SEPARATOR = " — ";

const ROUTE_TITLES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/login$/, "Login"],
  [/^\/logout$/, "Keluar"],
  [/^\/signed-out\/[^/]+$/, "Keluar dari Aplikasi"],
  [/^\/overview$/, "Beranda"],
  [/^\/my-apps$/, "Aplikasi Saya"],
  [/^\/favorites$/, "Favorit"],
  [/^\/recent$/, "Terbaru"],
  [/^\/profile$/, "Profil Saya"],
  [/^\/settings$/, "Pengaturan"],
  [/^\/users$/, "Manajemen Pengguna"],
  [/^\/users\/new$/, "Tambah Pengguna"],
  [/^\/users\/[^/]+\/history$/, "Riwayat Pengguna"],
  [/^\/users\/[^/]+\/security$/, "Keamanan Pengguna"],
  [/^\/users\/[^/]+$/, "Ubah Pengguna"],
  [/^\/groups$/, "Manajemen Grup & Akses"],
  [/^\/groups\/new$/, "Tambah Grup"],
  [/^\/groups\/[^/]+\/members$/, "Pengguna Grup"],
  [/^\/groups\/[^/]+\/applications$/, "Akses Aplikasi Grup"],
  [/^\/groups\/[^/]+\/menus$/, "Akses Menu Grup"],
  [/^\/groups\/[^/]+$/, "Ubah Grup"],
  [/^\/applications$/, "Manajemen Aplikasi"],
  [/^\/applications\/new$/, "Tambah Aplikasi"],
  [/^\/applications\/[^/]+\/users$/, "Pengguna Aplikasi"],
  [/^\/applications\/[^/]+\/credentials$/, "Kredensial SSO"],
  [/^\/applications\/[^/]+$/, "Ubah Aplikasi"],
  [/^\/menus$/, "Manajemen Menu"],
  [/^\/menus\/sections\/new$/, "Tambah Bagian"],
  [/^\/menus\/sections\/[^/]+$/, "Ubah Bagian"],
  [/^\/menus\/new$/, "Tambah Menu"],
  [/^\/menus\/[^/]+$/, "Ubah Menu"],
  [/^\/audit$/, "Riwayat Aktivitas"],
  [/^\/launch\/[^/]+$/, "Membuka Aplikasi"],
];

export function pageTitle(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const match = ROUTE_TITLES.find(([pattern]) => pattern.test(path));

  return match ? `${APP_NAME}${TITLE_SEPARATOR}${match[1]}` : APP_NAME;
}
