import type { AuditChange } from "@/features/audit/api";

const FIELD_LABELS: Record<string, string> = {
  name: "Nama",
  email: "Email",
  employeeNumber: "Nomor Karyawan",
  department: "Departemen",
  departemenCode: "Kode Departemen",
  jobTitle: "Jabatan",
  isActive: "Status Aktif",
  deleted: "Terhapus",
  slug: "Slug",
  description: "Deskripsi",
  launchUrl: "URL Aplikasi",
  usesSso: "Login Lewat SSO",
  category: "Kategori",
  icon: "Ikon",
  color: "Warna",
  status: "Status",
  members: "Pengguna",
  applications: "Akses Aplikasi",
  menus: "Akses Menu",
  parentId: "Menu Induk",
  label: "Label",
  targetType: "Jenis Tujuan",
  targetValue: "Tujuan",
  groups: "Grup Penerima",
  applicationId: "Aplikasi",
  path: "Path",
  roles: "Role",
  clientId: "Client ID",
  scope: "Scope",
  userId: "Pengguna",
  userName: "Nama Pengguna",
  applicationName: "Nama Aplikasi",
  canLaunch: "Boleh Membuka",
};

export type ChangeView = {
  field: string;
  label: string;
  before: string;
  after: string;
  added: string[];
  removed: string[];
  isList: boolean;
};

type Named = { id?: unknown; name?: unknown; role?: unknown };

function isNamed(value: unknown): value is Named {
  return typeof value === "object" && value !== null && "name" in value;
}

function itemKey(value: unknown): string {
  if (isNamed(value)) {
    return `${String(value.id ?? value.name)}|${String(value.role ?? "")}`;
  }

  return JSON.stringify(value);
}

function itemText(value: unknown): string {
  if (isNamed(value)) {
    return value.role
      ? `${String(value.name)} (${String(value.role)})`
      : String(value.name);
  }

  return formatValue(value);
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.map(itemText).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function describeChange(change: AuditChange): ChangeView {
  const before = Array.isArray(change.before) ? change.before : null;
  const after = Array.isArray(change.after) ? change.after : null;
  const isList = before !== null || after !== null;

  let added: string[] = [];
  let removed: string[] = [];

  if (isList) {
    const beforeItems = before ?? [];
    const afterItems = after ?? [];
    const beforeKeys = new Set(beforeItems.map(itemKey));
    const afterKeys = new Set(afterItems.map(itemKey));

    added = afterItems
      .filter((item) => !beforeKeys.has(itemKey(item)))
      .map(itemText);

    removed = beforeItems
      .filter((item) => !afterKeys.has(itemKey(item)))
      .map(itemText);
  }

  return {
    field: change.field,
    label: fieldLabel(change.field),
    before: formatValue(change.before),
    after: formatValue(change.after),
    added,
    removed,
    isList,
  };
}
