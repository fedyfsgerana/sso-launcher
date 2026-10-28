type LeveledMenu = Readonly<{
  id: string;
  parentId: string | null;
  label: string;
  targetType: string;
}>;

export function levelLabel(level: number) {
  if (level === 0) {
    return "Menu Utama";
  }

  if (level === 1) {
    return "Submenu";
  }

  if (level === 2) {
    return "Sub Submenu";
  }

  return `Submenu Tingkat ${level}`;
}

export function menuLevelOf(menus: readonly LeveledMenu[], menu: LeveledMenu) {
  let level = 0;
  let current = menus.find((item) => item.id === menu.parentId);

  while (current && current.targetType !== "section") {
    level += 1;
    const parentId = current.parentId;
    current = menus.find((item) => item.id === parentId);
  }

  return level;
}

export function sectionOfMenu(
  menus: readonly LeveledMenu[],
  menu: LeveledMenu,
): LeveledMenu | undefined {
  let current: LeveledMenu | undefined = menu;

  while (current && current.targetType !== "section") {
    const parentId: string | null = current.parentId;
    current = menus.find((item) => item.id === parentId);
  }

  return current;
}

export function menuPathOf(menus: readonly LeveledMenu[], menu: LeveledMenu) {
  const labels: string[] = [];
  let current: LeveledMenu | undefined = menu;

  while (current && current.targetType !== "section") {
    labels.unshift(current.label);
    const parentId: string | null = current.parentId;
    current = menus.find((item) => item.id === parentId);
  }

  return labels.join(" / ");
}
