import { REQUIRED_MESSAGE } from "@/lib/portal/validation";

export const PASSWORD_MIN_LENGTH = 12;

export type PasswordCheck = Readonly<{
  key: string;
  label: string;
  ok: boolean;
}>;

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    {
      key: "length",
      label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`,
      ok: value.length >= PASSWORD_MIN_LENGTH,
    },
    { key: "upper", label: "Huruf besar", ok: /\p{Lu}/u.test(value) },
    { key: "lower", label: "Huruf kecil", ok: /\p{Ll}/u.test(value) },
    { key: "digit", label: "Angka", ok: /\p{Nd}/u.test(value) },
    {
      key: "symbol",
      label: "Simbol, misalnya ! @ # $",
      ok: /[^\p{L}\p{Nd}\s]/u.test(value),
    },
  ];
}

export function isStrongPassword(value: string): boolean {
  return passwordChecks(value).every((check) => check.ok);
}

export function passwordError(value: string): string | undefined {
  if (!value.trim()) {
    return REQUIRED_MESSAGE;
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Minimal ${PASSWORD_MIN_LENGTH} karakter`;
  }

  return isStrongPassword(value)
    ? undefined
    : "Harus memuat huruf besar, huruf kecil, angka, dan simbol";
}
