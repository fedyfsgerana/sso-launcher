import { describe, expect, it } from "vitest";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import {
  LOOSE_KEY,
  TABLE_VIEW_THRESHOLD,
  buildMenuTree,
  collapsibleKeys,
  deletableMenuIds,
  prefersTableView,
  selectableMenuIds,
  type TreeFilter,
} from "@/features/menus/menu-tree";

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
  section("2", 0, "Gudang"),
  menu("10", "1", 1, { label: "Beranda" }),
  menu("11", "1", 0, { label: "Aplikasi Saya", isSystem: true }),
  menu("20", "2", 0, { label: "Persediaan", targetValue: "/gudang" }),
  menu("21", "20", 0, { label: "Stok Bahan", isActive: false }),
  menu("22", "20", 1, { label: "Penerimaan", maintenanceActive: true }),
  menu("30", null, 0, { label: "Lepas" }),
];

const NONE: TreeFilter = { query: "", status: "", section: "", collapsed: [] };

function keys(filter: Partial<TreeFilter> = {}) {
  return buildMenuTree(MENUS, { ...NONE, ...filter }).map((row) => row.key);
}

describe("buildMenuTree", () => {
  it("menyusun bagian, menu, dan submenu sesuai urutan", () => {
    expect(keys()).toEqual([
      "2",
      "20",
      "21",
      "22",
      "1",
      "11",
      "10",
      LOOSE_KEY,
      "30",
    ]);
  });

  it("memberi kedalaman dan jumlah anak yang benar", () => {
    const rows = buildMenuTree(MENUS, NONE);
    const byKey = new Map(rows.map((row) => [row.key, row]));

    expect(byKey.get("2")).toMatchObject({
      kind: "section",
      depth: 0,
      children: 1,
    });
    expect(byKey.get("20")).toMatchObject({
      kind: "menu",
      depth: 1,
      children: 2,
    });
    expect(byKey.get("21")).toMatchObject({ depth: 2, children: 0 });
    expect(byKey.get(LOOSE_KEY)).toMatchObject({
      kind: "section",
      menu: null,
    });
  });

  it("menyembunyikan submenu dari menu yang diciutkan", () => {
    expect(keys({ collapsed: ["20"] })).toEqual([
      "2",
      "20",
      "1",
      "11",
      "10",
      LOOSE_KEY,
      "30",
    ]);
  });

  it("menyembunyikan seluruh isi bagian yang diciutkan", () => {
    expect(keys({ collapsed: ["2"] })).toEqual([
      "2",
      "1",
      "11",
      "10",
      LOOSE_KEY,
      "30",
    ]);
  });

  it("pencarian tetap menampilkan induk menu yang cocok", () => {
    const rows = buildMenuTree(MENUS, { ...NONE, query: "stok" });

    expect(rows.map((row) => row.key)).toEqual(["2", "20", "21"]);
    expect(rows.find((row) => row.key === "20")?.matched).toBe(false);
    expect(rows.find((row) => row.key === "21")?.matched).toBe(true);
  });

  it("pencarian juga mencocokkan alamat menu", () => {
    expect(keys({ query: "/gudang" })).toEqual(["2", "20"]);
  });

  it("pencarian mengabaikan menu yang diciutkan", () => {
    expect(keys({ query: "stok", collapsed: ["2", "20"] })).toEqual([
      "2",
      "20",
      "21",
    ]);
  });

  it("menyaring menurut status", () => {
    expect(keys({ status: "off" })).toEqual(["2", "20", "21"]);
    expect(keys({ status: "maintenance" })).toEqual(["2", "20", "22"]);
  });

  it("menyaring menurut bagian", () => {
    expect(keys({ section: "1" })).toEqual(["1", "11", "10"]);
    expect(keys({ section: LOOSE_KEY })).toEqual([LOOSE_KEY, "30"]);
  });

  it("tetap menampilkan bagian kosong saat tidak menyaring", () => {
    const rows = buildMenuTree([...MENUS, section("3", 2, "Kosong")], NONE);

    expect(rows.some((row) => row.key === "3")).toBe(true);
  });
});

describe("collapsibleKeys", () => {
  it("berisi bagian, menu induk, dan kelompok tanpa bagian", () => {
    expect(collapsibleKeys(MENUS).sort()).toEqual(
      ["1", "2", "20", LOOSE_KEY].sort(),
    );
  });
});

describe("pilihan baris", () => {
  it("hanya baris menu yang bisa dipilih", () => {
    expect(selectableMenuIds(buildMenuTree(MENUS, NONE))).toEqual([
      "20",
      "21",
      "22",
      "11",
      "10",
      "30",
    ]);
  });

  it("menu sistem tidak ikut dihapus", () => {
    expect(deletableMenuIds(MENUS, ["10", "11", "21"])).toEqual(["10", "21"]);
  });
});

describe("prefersTableView", () => {
  it("memilih tabel saat jumlah menu melewati batas", () => {
    const count = TABLE_VIEW_THRESHOLD + 1;
    const many = Array.from({ length: count }, (_, index) =>
      menu(String(100 + index), "1", index),
    );

    expect(prefersTableView(MENUS)).toBe(false);
    expect(prefersTableView([section("1", 0, "Utama"), ...many])).toBe(true);
  });
});
