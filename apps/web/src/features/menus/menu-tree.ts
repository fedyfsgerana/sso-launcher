import type { AdminPortalMenu } from "@/features/menus/admin-api";
import {
  boardSections,
  groupChildren,
  isBoardFiltered,
} from "@/features/menus/menu-board";

export const TABLE_VIEW_THRESHOLD = 30;

export const LOOSE_KEY = "loose";

export type TreeRow = Readonly<{
  key: string;
  kind: "section" | "menu";
  menu: AdminPortalMenu | null;
  depth: number;
  children: number;
  expanded: boolean;
  matched: boolean;
}>;

export type TreeFilter = Readonly<{
  query: string;
  status: string;
  section: string;
  collapsed: readonly string[];
}>;

function matchesStatus(menu: AdminPortalMenu, status: string) {
  if (!status) {
    return true;
  }

  if (status === "maintenance") {
    return menu.maintenanceActive;
  }

  return (status === "on") === menu.isActive;
}

function matchesQuery(menu: AdminPortalMenu, keyword: string) {
  if (!keyword) {
    return true;
  }

  return `${menu.label} ${menu.targetValue}`
    .toLocaleLowerCase("id-ID")
    .includes(keyword);
}

export function buildMenuTree(
  menus: readonly AdminPortalMenu[],
  filter: TreeFilter,
): TreeRow[] {
  const childrenOf = groupChildren(menus);
  const keyword = filter.query.trim().toLocaleLowerCase("id-ID");
  const filtered = isBoardFiltered(filter.query, filter.status);

  function itemsOf(parentId: string) {
    return (childrenOf.get(parentId) ?? []).filter(
      (menu) => menu.targetType !== "section",
    );
  }

  function walk(parentId: string, depth: number): TreeRow[] {
    return itemsOf(parentId).flatMap((menu) => {
      const nested = walk(menu.id, depth + 1);
      const matched =
        matchesQuery(menu, keyword) && matchesStatus(menu, filter.status);

      if (filtered && !matched && nested.length === 0) {
        return [];
      }

      const children = itemsOf(menu.id).length;
      const expanded = filtered || !filter.collapsed.includes(menu.id);
      const row: TreeRow = {
        key: menu.id,
        kind: "menu",
        menu,
        depth,
        children,
        expanded,
        matched: !filtered || matched,
      };

      return [row, ...(children > 0 && expanded ? nested : [])];
    });
  }

  function group(
    key: string,
    section: AdminPortalMenu | null,
    parentId: string,
  ) {
    const rows = walk(parentId, 1);

    if (filtered && rows.length === 0) {
      return [];
    }

    if (!section && rows.length === 0) {
      return [];
    }

    const expanded = filtered || !filter.collapsed.includes(key);
    const head: TreeRow = {
      key,
      kind: "section",
      menu: section,
      depth: 0,
      children: itemsOf(parentId).length,
      expanded,
      matched: true,
    };

    return [head, ...(expanded ? rows : [])];
  }

  const sections = boardSections(childrenOf).filter(
    (section) => !filter.section || section.id === filter.section,
  );

  const rows = sections.flatMap((section) =>
    group(section.id, section, section.id),
  );

  if (!filter.section || filter.section === LOOSE_KEY) {
    rows.push(...group(LOOSE_KEY, null, ""));
  }

  return rows;
}

export function collapsibleKeys(menus: readonly AdminPortalMenu[]) {
  const childrenOf = groupChildren(menus);
  const keys = boardSections(childrenOf).map((section) => section.id);

  for (const menu of menus) {
    if (
      menu.targetType !== "section" &&
      (childrenOf.get(menu.id) ?? []).some(
        (child) => child.targetType !== "section",
      )
    ) {
      keys.push(menu.id);
    }
  }

  const loose = (childrenOf.get("") ?? []).some(
    (menu) => menu.targetType !== "section",
  );

  if (loose) {
    keys.push(LOOSE_KEY);
  }

  return keys;
}

export function selectableMenuIds(rows: readonly TreeRow[]) {
  return rows.filter((row) => row.kind === "menu").map((row) => row.key);
}

export function deletableMenuIds(
  menus: readonly AdminPortalMenu[],
  ids: readonly string[],
) {
  const system = new Set(
    menus.filter((menu) => menu.isSystem).map((menu) => menu.id),
  );

  return ids.filter((id) => !system.has(id));
}

export function prefersTableView(menus: readonly AdminPortalMenu[]) {
  return (
    menus.filter((menu) => menu.targetType !== "section").length >
    TABLE_VIEW_THRESHOLD
  );
}
