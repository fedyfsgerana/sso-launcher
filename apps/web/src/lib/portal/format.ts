const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatClock(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function formatSeconds(value: Date): string {
  return pad(value.getSeconds());
}

export function formatFullDate(value: Date): string {
  return `${DAYS[value.getDay()]}, ${value.getDate()} ${
    MONTHS[value.getMonth()]
  } ${value.getFullYear()}`;
}

export function formatRelative(value: string): string {
  const date = new Date(value);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diff === 0) {
    return `Hari ini, ${time}`;
  }

  if (diff === 1) {
    return `Kemarin, ${time}`;
  }

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}

export function greeting(value: Date): string {
  const hours = value.getHours();

  if (hours < 11) {
    return "Selamat pagi";
  }

  if (hours < 15) {
    return "Selamat siang";
  }

  if (hours < 18) {
    return "Selamat sore";
  }

  return "Selamat malam";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timezoneLabel(value: Date): string {
  const offset = -value.getTimezoneOffset() / 60;
  const zones: Record<number, string> = { 7: "WIB", 8: "WITA", 9: "WIT" };

  return zones[offset] ?? `UTC${offset >= 0 ? "+" : ""}${offset}`;
}

type RoleSource = Readonly<{
  jobTitle: string | null;
  department: string | null;
  departemenCode: string | null;
}>;

export function userRoleTag(user: RoleSource | null) {
  if (!user) {
    return "";
  }

  return [user.departemenCode ?? user.department, user.jobTitle?.trim()]
    .filter(Boolean)
    .join(" · ");
}

export function departmentLabel(
  department: string | null,
  departemenCode: string | null,
) {
  if (!department) {
    return departemenCode ?? "-";
  }

  return departemenCode ? `${department} (${departemenCode})` : department;
}
