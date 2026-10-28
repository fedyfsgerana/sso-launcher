export type PaletteKey =
  | "teal"
  | "slate"
  | "orange"
  | "indigo"
  | "ocean"
  | "red"
  | "gold"
  | "magenta"
  | "navy"
  | "violet"
  | "brown"
  | "gray";

export type PaletteColor = Readonly<{
  key: PaletteKey;
  label: string;
  hex: string;
  appClass: string;
}>;

export const PALETTE: readonly PaletteColor[] = [
  { key: "teal", label: "Teal", hex: "#0f766e", appClass: "app-hr" },
  { key: "slate", label: "Biru Slate", hex: "#3f5f8a", appClass: "app-wh" },
  { key: "orange", label: "Oranye", hex: "#d27a1f", appClass: "app-pr" },
  { key: "indigo", label: "Indigo", hex: "#5a55c9", appClass: "app-pj" },
  { key: "ocean", label: "Biru Laut", hex: "#0b7fab", appClass: "app-as" },
  { key: "red", label: "Merah", hex: "#c43d2f", appClass: "app-dc" },
  { key: "gold", label: "Emas", hex: "#a8861a", appClass: "app-fn" },
  { key: "magenta", label: "Magenta", hex: "#b83f8e", appClass: "app-hd" },
  { key: "navy", label: "Navy", hex: "#1f3a68", appClass: "app-nv" },
  { key: "violet", label: "Ungu", hex: "#8b3fb8", appClass: "app-vi" },
  { key: "brown", label: "Cokelat", hex: "#8a5a3b", appClass: "app-br" },
  { key: "gray", label: "Abu", hex: "#4b5563", appClass: "app-gy" },
];

export const APP_COLOR_LABELS: Readonly<Record<string, string>> =
  Object.fromEntries(PALETTE.map((color) => [color.appClass, color.label]));

export function paletteVar(key: PaletteKey, variant?: "soft" | "line" | "ink") {
  return `var(--pal-${key}${variant ? `-${variant}` : ""})`;
}

const AVATAR_COLORS = PALETTE.filter(
  (color) => color.key !== "gray" && color.key !== "red",
);

export function avatarColorClass(seed: string) {
  const text = seed.trim().toLocaleLowerCase("id-ID");
  let hash = 0;

  for (const character of text) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length].appClass;
}
