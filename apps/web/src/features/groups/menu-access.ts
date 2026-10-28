import type { PickView } from "@/components/management/pick-toolbar";
import type {
  AdminPortalMenu,
  MenuActionDefinition,
} from "@/features/menus/admin-api";

export type MenuAccessRow = Readonly<{
  menu: AdminPortalMenu;
  depth: number;
  descendants: string[];
}>;

export type MenuAccessColumn = {
  section: MenuAccessRow | null;
  rows: MenuAccessRow[];
};

export type MenuAccessFilter = Readonly<{
  query: string;
  view: PickView;
  selected: readonly string[];
}>;

export type GrantedAction = Readonly<{
  menuId: string;
  actionKey: string;
}>;

export function sameSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length && left.every((item) => right.includes(item))
  );
}

export function actionToken(menuId: string, actionKey: string) {
  return `${menuId}:${actionKey}`;
}

function childrenIndex(menus: readonly AdminPortalMenu[]) {
  const index = new Map<string, AdminPortalMenu[]>();

  for (const menu of menus) {
    const key = menu.parentId ?? "";
    index.set(key, [...(index.get(key) ?? []), menu]);
  }

  for (const list of index.values()) {
    list.sort((left, right) => left.sortOrder - right.sortOrder);
  }

  return index;
}

export function buildMenuAccessRows(
  menus: readonly AdminPortalMenu[],
  filter: MenuAccessFilter,
): MenuAccessRow[] {
  const index = childrenIndex(menus);
  const keyword = filter.query.trim().toLowerCase();
  const childrenOf = (parentId: string | null) =>
    index.get(parentId ?? "") ?? [];

  const matches = (menu: AdminPortalMenu) => {
    const on = filter.selected.includes(menu.id);

    if (filter.view === "selected" && !on) {
      return false;
    }

    if (filter.view === "unselected" && on) {
      return false;
    }

    return `${menu.label} ${menu.targetValue}`.toLowerCase().includes(keyword);
  };

  const descendantsOf = (menuId: string): string[] =>
    childrenOf(menuId).flatMap((child) => [
      child.id,
      ...descendantsOf(child.id),
    ]);

  const visit = (menu: AdminPortalMenu, depth: number): MenuAccessRow[] => {
    const nested = childrenOf(menu.id).flatMap((child) =>
      visit(child, depth + 1),
    );

    if (!matches(menu) && nested.length === 0) {
      return [];
    }

    return [{ menu, depth, descendants: descendantsOf(menu.id) }, ...nested];
  };

  return childrenOf(null).flatMap((root) => visit(root, 0));
}

export function groupMenuAccessColumns(
  rows: readonly MenuAccessRow[],
): MenuAccessColumn[] {
  const result: MenuAccessColumn[] = [];
  let loose: MenuAccessColumn | null = null;

  for (const row of rows) {
    if (row.menu.targetType === "section") {
      result.push({ section: row, rows: [] });
    } else if (row.depth === 0) {
      if (!loose) {
        loose = { section: null, rows: [] };
        result.push(loose);
      }

      loose.rows.push(row);
    } else {
      result[result.length - 1]?.rows.push(row);
    }
  }

  return result;
}

export function actionsForMenu(
  menu: AdminPortalMenu,
  catalog: readonly MenuActionDefinition[],
) {
  if (menu.targetType !== "page") {
    return [];
  }

  const target = menu.targetValue.trim().replace(/^\/+|\/+$/g, "");

  return catalog.filter((item) => item.menuTarget === target);
}

function ancestorMenuIds(
  menu: AdminPortalMenu,
  menus: readonly AdminPortalMenu[],
) {
  const ids: string[] = [];
  let parentId = menu.parentId;

  while (parentId) {
    const id: string = parentId;
    const parent = menus.find((item) => item.id === id);

    if (!parent || parent.targetType === "section") {
      break;
    }

    ids.push(parent.id);
    parentId = parent.parentId;
  }

  return ids;
}

export function toggleMenuSelection(
  selected: readonly string[],
  row: MenuAccessRow,
  checked: boolean,
  menus: readonly AdminPortalMenu[],
) {
  const own = row.menu.targetType === "section" ? [] : [row.menu.id];
  const ids = [...own, ...row.descendants];

  return checked
    ? [...new Set([...selected, ...ids, ...ancestorMenuIds(row.menu, menus)])]
    : selected.filter((id) => !ids.includes(id));
}

export function toggleActionTokens(
  actions: readonly string[],
  tokens: readonly string[],
  checked: boolean,
) {
  return checked
    ? [...new Set([...actions, ...tokens])]
    : actions.filter((item) => !tokens.includes(item));
}

export function grantedActions(
  actions: readonly string[],
  selected: readonly string[],
): GrantedAction[] {
  return actions
    .map((token) => {
      const separator = token.indexOf(":");

      return {
        menuId: token.slice(0, separator),
        actionKey: token.slice(separator + 1),
      };
    })
    .filter((item) => selected.includes(item.menuId));
}

export function menuIndent(depth: number, inSection: boolean) {
  return (depth - (inSection ? 1 : 0)) * 20;
}
