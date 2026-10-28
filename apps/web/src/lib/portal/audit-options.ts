import {
  AppWindow,
  History,
  Info,
  Key,
  KeyRound,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  MonitorSmartphone,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  SquareArrowOutUpRight,
  SquareMenu,
  Star,
  StarOff,
  Trash2,
  Undo2,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export const AUDIT_ACTIONS = [
  { value: "create", label: "Tambah" },
  { value: "update", label: "Ubah" },
  { value: "delete", label: "Hapus" },
  { value: "restore", label: "Pulihkan" },
  { value: "rollback", label: "Kembalikan Versi" },
  { value: "grant", label: "Beri Akses" },
  { value: "revoke", label: "Cabut Akses" },
  { value: "login", label: "Masuk" },
  { value: "login_failed", label: "Gagal Masuk" },
  { value: "logout", label: "Keluar" },
  { value: "launch", label: "Buka Aplikasi" },
  { value: "favorite_add", label: "Tambah Favorit" },
  { value: "favorite_remove", label: "Hapus Favorit" },
  { value: "lock", label: "Dikunci" },
  { value: "unlock", label: "Kunci Dibuka" },
] as const;

export const AUDIT_TARGETS = [
  { value: "user", label: "Pengguna" },
  { value: "user_group", label: "Grup" },
  { value: "application", label: "Aplikasi" },
  { value: "application_menu", label: "Menu Aplikasi" },
  { value: "portal_menu", label: "Menu Portal" },
  { value: "access", label: "Akses Langsung" },
  { value: "service_credential", label: "Kredensial Layanan" },
  { value: "password", label: "Password" },
  { value: "session", label: "Sesi" },
  { value: "favorite", label: "Favorit" },
  { value: "activity", label: "Riwayat Pribadi" },
] as const;

export const AUDIT_MODULES = [
  { value: "users", label: "Pengguna" },
  { value: "groups", label: "Grup & Akses" },
  { value: "applications", label: "Aplikasi" },
  { value: "menus", label: "Menu Portal" },
  { value: "access", label: "Akses Langsung" },
  { value: "auth", label: "Login & Sesi" },
  { value: "portal", label: "Aktivitas Portal" },
] as const;

export const AUDIT_OUTCOMES = [
  { value: "success", label: "Berhasil" },
  { value: "failed", label: "Gagal" },
] as const;

const ACTION_ICONS: Record<string, LucideIcon> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  restore: RotateCcw,
  rollback: Undo2,
  baseline: Info,
  grant: ShieldCheck,
  revoke: ShieldOff,
  login: LogIn,
  login_failed: Lock,
  logout: LogOut,
  launch: SquareArrowOutUpRight,
  favorite_add: Star,
  favorite_remove: StarOff,
  lock: ShieldAlert,
  unlock: LockOpen,
};

const TARGET_ICONS: Record<string, LucideIcon> = {
  user: UserCog,
  user_group: UsersRound,
  application: AppWindow,
  application_menu: SquareMenu,
  portal_menu: SquareMenu,
  access: ShieldCheck,
  service_credential: Key,
  password: KeyRound,
  session: MonitorSmartphone,
  favorite: Star,
  activity: History,
};

export function actionLabel(action: string): string {
  if (action === "baseline") {
    return "Kondisi Awal";
  }

  return AUDIT_ACTIONS.find((item) => item.value === action)?.label ?? action;
}

export function targetLabel(target: string): string {
  return AUDIT_TARGETS.find((item) => item.value === target)?.label ?? target;
}

export function moduleLabel(module: string): string {
  return AUDIT_MODULES.find((item) => item.value === module)?.label ?? module;
}

export function outcomeLabel(outcome: string): string {
  return (
    AUDIT_OUTCOMES.find((item) => item.value === outcome)?.label ?? outcome
  );
}

export function actionIcon(action: string): LucideIcon {
  return ACTION_ICONS[action] ?? Pencil;
}

export function targetIcon(target: string): LucideIcon {
  return TARGET_ICONS[target] ?? SquareMenu;
}

const TARGET_COLORS: Record<string, string> = {
  user: "app-hr",
  user_group: "app-vi",
  application: "app-pj",
  application_menu: "app-wh",
  portal_menu: "app-wh",
  access: "app-nv",
  service_credential: "app-as",
  password: "app-pr",
  session: "app-hd",
  favorite: "app-fn",
  activity: "app-br",
};

export function targetColorClass(target: string): string {
  return TARGET_COLORS[target] ?? "app-wh";
}

export function actionTone(
  action: string,
  outcome = "success",
): "on" | "warn" | "off" | "danger" | "info" {
  if (outcome === "failed") {
    return "danger";
  }

  switch (action) {
    case "create":
    case "restore":
    case "grant":
    case "unlock":
    case "favorite_add":
      return "on";
    case "rollback":
      return "warn";
    case "delete":
    case "revoke":
    case "lock":
    case "login_failed":
      return "danger";
    case "update":
    case "launch":
      return "info";
    default:
      return "off";
  }
}

export function describeDevice(item: {
  operatingSystem: string | null;
  browser: string | null;
  browserVersion: string | null;
}): string {
  const browser = [item.browser, item.browserVersion].filter(Boolean).join(" ");

  return [item.operatingSystem, browser].filter(Boolean).join(" · ");
}

const SELF_DESCRIBING_ACTIONS = new Set([
  "launch",
  "favorite_add",
  "favorite_remove",
  "login",
  "login_failed",
  "logout",
  "lock",
  "unlock",
]);

const LEGACY_GROUP_DELETE = /^(\d+) anggota, (\d+) aplikasi, (\d+) menu$/;

type DescribableActivity = Readonly<{
  action: string;
  targetType: string;
  targetName: string;
  summary: string;
}>;

function fallbackDetail(action: string, target: string): string {
  const lower = target.toLowerCase();

  switch (action) {
    case "create":
      return `${target} baru ditambahkan`;
    case "update":
      return `Data ${lower} diperbarui`;
    case "delete":
      return `${target} dipindahkan ke tempat sampah`;
    case "restore":
      return `${target} dipulihkan dari tempat sampah`;
    case "rollback":
      return `${target} dikembalikan ke versi sebelumnya`;
    case "grant":
      return `Akses ${lower} diberikan`;
    case "revoke":
      return `Akses ${lower} dicabut`;
    default:
      return target;
  }
}

export function describeActivity(activity: DescribableActivity): {
  title: string;
  detail: string;
} {
  const action = actionLabel(activity.action);
  const target = targetLabel(activity.targetType);
  const name = activity.targetName.trim();
  const title = SELF_DESCRIBING_ACTIONS.has(activity.action)
    ? [action, name].filter(Boolean).join(" ")
    : [action, target.toLowerCase(), name].filter(Boolean).join(" ");

  const summary = activity.summary.trim();
  const legacy = LEGACY_GROUP_DELETE.exec(summary);

  if (legacy) {
    return {
      title,
      detail: `Grup dipindahkan ke tempat sampah beserta ${legacy[1]} anggota, ${legacy[2]} akses aplikasi, dan ${legacy[3]} akses menu`,
    };
  }

  return {
    title,
    detail: summary || fallbackDetail(activity.action, target),
  };
}
