import { describe, expect, it } from "vitest";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import {
  boardSections,
  buildBoardColumns,
  descendantMenuIds,
  groupChildren,
  isBoardFiltered,
  isDescendantMenu,
  menuPathLabel,
  normalizeOrders,
  parentMenuIds,
  placeMenuAmong,
  summarizeMenus,
} from "@/features/menus/menu-board";

function menu(
  id: string,
  parentId: string | null,
  sortOrder: number,
  overrides: Partial<AdminPortalMenu> = {},
): AdminPortalMenu {
  return {
    id,
    parentId,
    label: `Menu ${id}`,
    icon: "circle",
    targetType: "page",
    targetValue: `/menu-${id}`,
    sortOrder,
    isSystem: false,
    isActive: true,
    maintenanceActive: false,
    maintenanceTitle: null,
    maintenanceMessage: null,
    groupIds: [],
    groupNames: [],
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function section(id: string, sortOrder: number, label: string) {
  return menu(id, null, sortOrder, {
    label,
    targetType: "section",
    targetValue: "",
  });
}

const MENUS: AdminPortalMenu[] = [
  section("1", 1, "Utama"),
  section("2", 0, "Manajemen"),
  menu("10", "1", 1, { label: "Beranda" }),
  menu("11", "1", 0, { label: "Aplikasi Saya" }),
  menu("20", "2", 0, { label: "Pengguna" }),
  menu("21", "20", 0, { label: "Keamanan", isActive: false }),
  menu("22", "20", 1, { label: "Riwayat", maintenanceActive: true }),
  menu("30", null, 0, { label: "Lepas" }),
];

const NO_FILTER = { query: "", status: "", collapsed: [] };

function ids(items: readonly AdminPortalMenu[]) {
  return items.map((item) => item.id);
}

describe("groupChildren dan boardSections", () => {
  it("mengelompokkan anak per induk dan mengurutkan berdasarkan sortOrder", () => {
    const childrenOf = groupChildren(MENUS);

    expect(ids(childrenOf.get("1") ?? [])).toEqual(["11", "10"]);
    expect(ids(childrenOf.get("20") ?? [])).toEqual(["21", "22"]);
  });

  it("hanya mengambil bagian di tingkat paling atas, urut sesuai sortOrder", () => {
    expect(ids(boardSections(groupChildren(MENUS)))).toEqual(["2", "1"]);
  });
});

describe("parentMenuIds dan summarizeMenus", () => {
  it("mencatat menu yang punya submenu, bukan bagian", () => {
    expect([...parentMenuIds(MENUS)].sort()).toEqual(["1", "2", "20"]);
  });

  it("menghitung bagian, menu utama, submenu, dan yang perlu perhatian", () => {
    const sections = boardSections(groupChildren(MENUS));

    expect(summarizeMenus(MENUS, sections)).toEqual({
      sections: 2,
      mains: 4,
      subs: 2,
      attention: 2,
    });
  });
});

describe("buildBoardColumns", () => {
  const childrenOf = groupChildren(MENUS);
  const sections = boardSections(childrenOf);

  it("menyusun kolom per bagian dengan kedalaman, ditambah kolom tanpa bagian", () => {
    const columns = buildBoardColumns(childrenOf, sections, NO_FILTER);

    expect(columns.map((column) => column.key)).toEqual(["2", "1", "loose"]);
    expect(
      columns[0].rows.map((row) => [row.menu.id, row.depth, row.children]),
    ).toEqual([
      ["20", 0, 2],
      ["21", 1, 0],
      ["22", 1, 0],
    ]);
    expect(columns[0].total).toBe(3);
  });

  it("menyembunyikan submenu dari cabang yang ditutup", () => {
    const columns = buildBoardColumns(childrenOf, sections, {
      ...NO_FILTER,
      collapsed: ["20"],
    });

    expect(columns[0].rows.map((row) => row.menu.id)).toEqual(["20"]);
  });

  it("mempertahankan induk dari menu yang cocok dengan pencarian", () => {
    const columns = buildBoardColumns(childrenOf, sections, {
      ...NO_FILTER,
      query: "riwayat",
    });

    expect(columns.map((column) => column.key)).toEqual(["2"]);
    expect(columns[0].rows.map((row) => row.menu.id)).toEqual(["20", "22"]);
  });

  it("mengabaikan cabang tertutup saat sedang memfilter", () => {
    const columns = buildBoardColumns(childrenOf, sections, {
      query: "keamanan",
      status: "",
      collapsed: ["20"],
    });

    expect(columns[0].rows.map((row) => row.menu.id)).toEqual(["20", "21"]);
  });

  it("memfilter status perbaikan dan nonaktif", () => {
    const maintenance = buildBoardColumns(childrenOf, sections, {
      ...NO_FILTER,
      status: "maintenance",
    });
    const inactive = buildBoardColumns(childrenOf, sections, {
      ...NO_FILTER,
      status: "off",
    });

    expect(maintenance[0].rows.map((row) => row.menu.id)).toEqual(["20", "22"]);
    expect(inactive[0].rows.map((row) => row.menu.id)).toEqual(["20", "21"]);
  });

  it("menandai papan sebagai terfilter hanya jika ada kata kunci atau status", () => {
    expect(isBoardFiltered("  ", "")).toBe(false);
    expect(isBoardFiltered("menu", "")).toBe(true);
    expect(isBoardFiltered("", "on")).toBe(true);
  });
});

describe("hubungan induk dan keturunan", () => {
  it("mengenali keturunan dari sebuah menu", () => {
    expect(isDescendantMenu(MENUS, "21", "2")).toBe(true);
    expect(isDescendantMenu(MENUS, "21", "1")).toBe(false);
    expect(isDescendantMenu(MENUS, "20", "20")).toBe(true);
  });

  it("mengumpulkan menu beserta semua keturunannya", () => {
    expect([...descendantMenuIds(MENUS, "2")].sort()).toEqual([
      "2",
      "20",
      "21",
      "22",
    ]);
  });

  it("menyusun label jalur dari bagian sampai menu", () => {
    const keamanan = MENUS.find((item) => item.id === "21")!;

    expect(menuPathLabel(MENUS, keamanan)).toBe(
      "Manajemen / Pengguna / Keamanan",
    );
  });
});

describe("normalizeOrders dan placeMenuAmong", () => {
  it("menomori ulang urutan mulai dari 0 per induk", () => {
    const normalized = normalizeOrders([
      menu("a", "p", 5),
      menu("b", "p", 2),
      menu("c", "q", 9),
    ]);

    expect(normalized.map((item) => [item.id, item.sortOrder])).toEqual([
      ["a", 1],
      ["b", 0],
      ["c", 0],
    ]);
  });

  it("menaruh menu sebelum atau sesudah menu lain di induk yang sama", () => {
    const source = MENUS.find((item) => item.id === "10")!;
    const before = placeMenuAmong(MENUS, source, "1", "11", "before");
    const after = placeMenuAmong(MENUS, source, "1", "11", "after");

    expect(ids(groupChildren(before).get("1") ?? [])).toEqual(["10", "11"]);
    expect(ids(groupChildren(after).get("1") ?? [])).toEqual(["11", "10"]);
  });

  it("memindahkan menu ke induk lain dan menaruhnya di urutan terakhir", () => {
    const source = MENUS.find((item) => item.id === "30")!;
    const next = placeMenuAmong(MENUS, source, "20", null, "end");
    const moved = next.find((item) => item.id === "30")!;

    expect(moved.parentId).toBe("20");
    expect(ids(groupChildren(next).get("20") ?? [])).toEqual([
      "21",
      "22",
      "30",
    ]);
  });
});
