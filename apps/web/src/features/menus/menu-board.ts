import type { AdminPortalMenu } from "@/features/menus/admin-api";

export type BoardRow = Readonly<{
  menu: AdminPortalMenu;
  depth: number;
  children: number;
}>;

export type BoardColumn = Readonly<{
  key: string;
  section: AdminPortalMenu | null;
  rows: BoardRow[];
  total: number;
}>;

export type MenuSummary = Readonly<{
  sections: number;
  mains: number;
  subs: number;
  attention: number;
}>;

export type BoardFilter = Readonly<{
  query: string;
  status: string;
  collapsed: readonly string[];
}>;

export type PlacePosition = "before" | "after" | "end";

export function bySortOrder(left: AdminPortalMenu, right: AdminPortalMenu) {
  return left.sortOrder - right.sortOrder;
}

export function isBoardFiltered(query: string, status: string) {
  return Boolean(query.trim() || status);
}

export function groupChildren(menus: readonly AdminPortalMenu[]) {
  const map = new Map<string, AdminPortalMenu[]>();

  for (const menu of menus) {
    const key = menu.parentId ?? "";
    map.set(key, [...(map.get(key) ?? []), menu]);
  }

  for (const list of map.values()) {
    list.sort(bySortOrder);
  }

  return map;
}

export function parentMenuIds(menus: readonly AdminPortalMenu[]) {
  return new Set(
    menus
      .filter((menu) => menu.targetType !== "section")
      .map((menu) => menu.parentId)
      .filter((id): id is string => Boolean(id)),
  );
}

export function boardSections(
  childrenOf: ReadonlyMap<string, AdminPortalMenu[]>,
) {
  return (childrenOf.get("") ?? []).filter(
    (menu) => menu.targetType === "section",
  );
}

export function summarizeMenus(
  menus: readonly AdminPortalMenu[],
  sections: readonly AdminPortalMenu[],
): MenuSummary {
  const sectionIds = new Set(sections.map((section) => section.id));
  const items = menus.filter((menu) => menu.targetType !== "section");

  return {
    sections: sections.length,
    mains: items.filter(
      (menu) => !menu.parentId || sectionIds.has(menu.parentId),
    ).length,
    subs: items.filter(
      (menu) => menu.parentId && !sectionIds.has(menu.parentId),
    ).length,
    attention: items.filter((menu) => !menu.isActive || menu.maintenanceActive)
      .length,
  };
}

export function buildBoardColumns(
  childrenOf: ReadonlyMap<string, AdminPortalMenu[]>,
  sections: readonly AdminPortalMenu[],
  filter: BoardFilter,
): BoardColumn[] {
  const keyword = filter.query.trim().toLocaleLowerCase("id-ID");
  const filtered = isBoardFiltered(filter.query, filter.status);

  function matches(menu: AdminPortalMenu) {
    const text = `${menu.label} ${menu.targetValue}`.toLocaleLowerCase("id-ID");
    const status =
      !filter.status ||
      (filter.status === "maintenance"
        ? menu.maintenanceActive
        : (filter.status === "on") === menu.isActive);

    return (!keyword || text.includes(keyword)) && status;
  }

  function walk(parentId: string, depth: number): BoardRow[] {
    return (childrenOf.get(parentId) ?? [])
      .filter((menu) => menu.targetType !== "section")
      .flatMap((menu) => {
        const nested = walk(menu.id, depth + 1);
        const children = (childrenOf.get(menu.id) ?? []).length;

        if (filtered && !matches(menu) && nested.length === 0) {
          return [];
        }

        const hidden = !filtered && filter.collapsed.includes(menu.id);

        return [{ menu, depth, children }, ...(hidden ? [] : nested)];
      });
  }

  function count(parentId: string): number {
    return (childrenOf.get(parentId) ?? []).reduce(
      (total, menu) => total + 1 + count(menu.id),
      0,
    );
  }

  const result: BoardColumn[] = sections.map((section) => ({
    key: section.id,
    section,
    rows: walk(section.id, 0),
    total: count(section.id),
  }));

  const loose = walk("", 0);

  if (loose.length > 0) {
    result.push({
      key: "loose",
      section: null,
      rows: loose,
      total: loose.length,
    });
  }

  return filtered ? result.filter((column) => column.rows.length > 0) : result;
}

export function normalizeOrders(items: readonly AdminPortalMenu[]) {
  const groups = new Map<string, AdminPortalMenu[]>();

  for (const menu of items) {
    const key = menu.parentId ?? "root";
    groups.set(key, [...(groups.get(key) ?? []), menu]);
  }

  const orderById = new Map<string, number>();

  for (const group of groups.values()) {
    group
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .forEach((menu, index) => orderById.set(menu.id, index));
  }

  return items.map((menu) => ({
    ...menu,
    sortOrder: orderById.get(menu.id) ?? menu.sortOrder,
  }));
}

export function isDescendantMenu(
  menus: readonly AdminPortalMenu[],
  candidateId: string,
  ancestorId: string,
) {
  let current: string | null = candidateId;

  while (current) {
    if (current === ancestorId) {
      return true;
    }

    const id: string = current;
    current = menus.find((menu) => menu.id === id)?.parentId ?? null;
  }

  return false;
}

export function descendantMenuIds(
  menus: readonly AdminPortalMenu[],
  menuId: string,
) {
  const result = new Set<string>([menuId]);
  let added = true;

  while (added) {
    added = false;

    for (const item of menus) {
      if (item.parentId && result.has(item.parentId) && !result.has(item.id)) {
        result.add(item.id);
        added = true;
      }
    }
  }

  return result;
}

export function menuPathLabel(
  menus: readonly AdminPortalMenu[],
  menu: AdminPortalMenu,
) {
  const labels: string[] = [];
  let current: AdminPortalMenu | undefined = menu;

  while (current) {
    labels.unshift(current.label);
    const parentId: string | null = current.parentId;
    current = menus.find((item) => item.id === parentId);
  }

  return labels.join(" / ");
}

export function placeMenuAmong(
  menus: readonly AdminPortalMenu[],
  source: AdminPortalMenu,
  parentId: string | null,
  anchorId: string | null,
  position: PlacePosition,
) {
  const siblings = menus
    .filter((menu) => menu.parentId === parentId && menu.id !== source.id)
    .sort(bySortOrder);
  const anchorIndex = anchorId
    ? siblings.findIndex((menu) => menu.id === anchorId)
    : -1;
  const index =
    position === "end" || anchorIndex < 0
      ? siblings.length
      : position === "after"
        ? anchorIndex + 1
        : anchorIndex;

  siblings.splice(index, 0, { ...source, parentId });

  const order = new Map(siblings.map((menu, place) => [menu.id, place]));

  return menus.map((menu) =>
    menu.id === source.id
      ? { ...menu, parentId, sortOrder: order.get(menu.id) ?? 0 }
      : order.has(menu.id)
        ? { ...menu, sortOrder: order.get(menu.id) ?? menu.sortOrder }
        : menu,
  );
}
