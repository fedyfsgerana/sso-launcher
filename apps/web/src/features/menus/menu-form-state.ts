import type {
  AdminPortalMenu,
  PortalMenuInput,
} from "@/features/menus/admin-api";
import { descendantMenuIds } from "@/features/menus/menu-board";
import {
  menuLevelOf,
  menuPathOf,
  sectionOfMenu,
} from "@/lib/portal/menu-levels";
import { requireText, requireUrl } from "@/lib/portal/validation";

export type MenuFormValue = Readonly<{
  label: string;
  icon: string;
  sectionId: string;
  parentId: string;
  targetType: string;
  targetValue: string;
  isActive: boolean;
  isSystem: boolean;
}>;

export type MenuPlacement = Readonly<{
  level: number;
  sectionId: string;
  parentId: string;
}>;

type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

export const DEFAULT_PAGE_TARGET = "overview";

export const EMPTY_MENU_FORM: MenuFormValue = {
  label: "",
  icon: "",
  sectionId: "",
  parentId: "",
  targetType: "page",
  targetValue: DEFAULT_PAGE_TARGET,
  isActive: true,
  isSystem: false,
};

export function normalizeInternalPath(value: string) {
  const path = value.trim();

  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function defaultTargetValue(targetType: string) {
  if (targetType === "page") {
    return DEFAULT_PAGE_TARGET;
  }

  return targetType === "url" ? "" : "/";
}

export function placementUnder(
  menus: readonly AdminPortalMenu[],
  parentId: string,
): MenuPlacement | null {
  const parent = menus.find((item) => item.id === parentId);

  if (!parent) {
    return null;
  }

  const isSection = parent.targetType === "section";

  return {
    level: isSection ? 0 : menuLevelOf(menus, parent) + 1,
    sectionId: sectionOfMenu(menus, parent)?.id ?? "",
    parentId: isSection ? "" : parent.id,
  };
}

export function menuFormFromMenu(
  menus: readonly AdminPortalMenu[],
  menu: AdminPortalMenu,
): MenuFormValue {
  const parent = menus.find((item) => item.id === menu.parentId);

  return {
    label: menu.label,
    icon: menu.icon,
    sectionId: sectionOfMenu(menus, menu)?.id ?? "",
    parentId: parent && parent.targetType !== "section" ? parent.id : "",
    targetType: menu.targetType,
    targetValue: menu.targetValue,
    isActive: menu.isActive,
    isSystem: menu.isSystem,
  };
}

export function sectionOptions(
  menus: readonly AdminPortalMenu[],
): SelectOption[] {
  return menus
    .filter((menu) => menu.parentId === null && menu.targetType === "section")
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((menu) => ({ value: menu.id, label: menu.label }));
}

export function parentOptions(
  menus: readonly AdminPortalMenu[],
  level: number,
  menuId?: string,
): SelectOption[] {
  if (level === 0) {
    return [];
  }

  const blocked = menuId ? descendantMenuIds(menus, menuId) : new Set<string>();

  return menus
    .filter(
      (menu) =>
        menu.targetType !== "section" &&
        !blocked.has(menu.id) &&
        menuLevelOf(menus, menu) === level - 1,
    )
    .map((menu) => ({
      value: menu.id,
      label: `${menuPathOf(menus, menu)} (${
        sectionOfMenu(menus, menu)?.label ?? "Tanpa bagian"
      })`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function parentSectionLabel(
  menus: readonly AdminPortalMenu[],
  parentId: string,
) {
  const parent = menus.find((menu) => menu.id === parentId);

  return parent ? (sectionOfMenu(menus, parent)?.label ?? "Tanpa bagian") : "";
}

export function validateMenuForm(
  value: MenuFormValue,
  options: Readonly<{ level: number; hasChildren: boolean }>,
) {
  return {
    label: requireText(value.label),
    sectionId:
      options.level === 0 && !value.sectionId ? "Pilih bagian" : undefined,
    parentId:
      options.level > 0 && !value.parentId ? "Pilih menu induk" : undefined,
    targetValue: options.hasChildren
      ? undefined
      : value.targetType === "url"
        ? requireUrl(value.targetValue)
        : requireText(value.targetValue),
  };
}

export function menuAccessLink(form: MenuFormValue) {
  return form.targetType === "url"
    ? form.targetValue
    : normalizeInternalPath(form.targetValue);
}

export function menuPayload(
  form: MenuFormValue,
  level: number,
): PortalMenuInput {
  return {
    label: form.label.trim(),
    icon: form.icon,
    parentId: (level === 0 ? form.sectionId : form.parentId) || null,
    targetType: form.targetType as "page" | "custom" | "url",
    targetValue:
      form.targetType === "url" || form.targetType === "page"
        ? form.targetValue.trim()
        : normalizeInternalPath(form.targetValue),
    isActive: form.isActive,
  };
}
