import { PALETTE } from "@/lib/portal/palette";

export const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Nonaktif" },
] as const;

export const STATUS_FORM_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
] as const;

export const OTHER_CATEGORY = "Lainnya";

type NamedDepartment = Readonly<{ name: string }>;

export function applicationCategories(
  departments: ReadonlyArray<NamedDepartment>,
) {
  return [...departments.map((department) => department.name), OTHER_CATEGORY];
}

export function categoryOptions(categories: readonly string[], current = "") {
  const values =
    current && !categories.includes(current)
      ? [...categories, current]
      : [...categories];

  return values.map((value) => ({ value, label: value }));
}

const APP_DESCRIPTIONS = [
  "Aplikasi internal perusahaan",
  "Aplikasi pendukung operasional harian",
  "Aplikasi pencatatan dan pelaporan data",
  "Aplikasi administrasi dan pengelolaan dokumen",
  "Aplikasi pengajuan dan persetujuan",
  "Aplikasi pemantauan dan dasbor",
  "Aplikasi data induk dan referensi",
  "Aplikasi untuk seluruh karyawan",
  "Aplikasi lintas departemen",
  "Aplikasi pihak ketiga",
  "Aplikasi dalam tahap uji coba",
] as const;

type AppDescriptionContext = Readonly<{
  name: string;
  category: string;
}>;

function knownDescriptions({ name, category }: AppDescriptionContext) {
  const specific =
    name.trim() && category && category !== OTHER_CATEGORY
      ? [`Aplikasi ${name.trim()} untuk departemen ${category}`]
      : [];

  return [...specific, ...APP_DESCRIPTIONS];
}

export function descriptionOptions(
  context: AppDescriptionContext,
  current = "",
) {
  const known = knownDescriptions(context);
  const values =
    current && !known.includes(current) ? [...known, current] : [...known];

  return values.map((value) => ({ value, label: value }));
}

export function isKnownDescription(
  context: AppDescriptionContext,
  value: string,
) {
  return knownDescriptions(context).includes(value);
}

const GROUP_DESCRIPTIONS = [
  "Grup akses umum untuk seluruh karyawan",
  "Grup akses untuk karyawan satu departemen",
  "Grup akses untuk karyawan dengan jabatan yang sama",
  "Grup akses untuk staf operasional dan lapangan",
  "Grup akses untuk staf administrasi dan kantor",
  "Grup akses untuk supervisor dan kepala bagian",
  "Grup akses untuk manajer dan pimpinan departemen",
  "Grup akses untuk direksi",
  "Grup akses lintas departemen",
  "Grup akses untuk administrator sistem",
  "Grup akses untuk pengelola portal",
  "Grup akses untuk tim IT dan dukungan teknis",
  "Grup akses untuk auditor dan pemeriksa internal",
  "Grup akses terbatas untuk mitra dan pihak luar",
  "Grup akses sementara untuk proyek",
  "Grup akses sementara untuk uji coba",
] as const;

type GroupDescriptionContext = Readonly<{
  name: string;
  department: string;
}>;

export function groupDescriptionOptions(
  { name, department }: GroupDescriptionContext,
  current = "",
) {
  const specific =
    name.trim() && department
      ? [`Grup akses ${name.trim()} departemen ${department}`]
      : [];
  const known: readonly string[] = [...specific, ...GROUP_DESCRIPTIONS];
  const values =
    current && !known.includes(current) ? [...known, current] : [...known];

  return values.map((value) => ({ value, label: value }));
}

export function sortCategories(
  values: Iterable<string>,
  order: readonly string[] = [],
) {
  const rank = (value: string) => {
    if (value === OTHER_CATEGORY) {
      return Number.MAX_SAFE_INTEGER;
    }

    const index = order.indexOf(value);

    return index === -1 ? order.length : index;
  };

  return [...new Set(values)]
    .filter(Boolean)
    .sort(
      (left, right) => rank(left) - rank(right) || left.localeCompare(right),
    );
}

export const TARGET_OPTIONS = [
  { value: "page", label: "Halaman portal" },
  { value: "custom", label: "Halaman kustom baru" },
  { value: "url", label: "Tautan eksternal" },
] as const;

export const PAGE_TARGETS = [
  { value: "overview", label: "Beranda" },
  { value: "my-apps", label: "Aplikasi Saya" },
  { value: "favorites", label: "Favorit" },
  { value: "recent", label: "Terbaru" },
  { value: "menus", label: "Manajemen Menu" },
  { value: "users", label: "Manajemen Pengguna" },
  { value: "groups", label: "Manajemen Grup & Akses" },
  { value: "applications", label: "Manajemen Aplikasi" },
  { value: "audit", label: "Riwayat Aktivitas" },
] as const;

export const APP_COLORS = PALETTE.map((color) => color.appClass);

export function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

export function statusTone(status: string): "on" | "warn" | "danger" {
  if (status === "active") {
    return "on";
  }

  if (status === "maintenance") {
    return "warn";
  }

  return "danger";
}
