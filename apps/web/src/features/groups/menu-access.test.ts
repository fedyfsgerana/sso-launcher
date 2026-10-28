import { describe, expect, it } from "vitest";
import type {
  AdminPortalMenu,
  MenuActionDefinition,
} from "@/features/menus/admin-api";
import {
  actionToken,
  actionsForMenu,
  buildMenuAccessRows,
  grantedActions,
  groupMenuAccessColumns,
  menuIndent,
  sameSet,
  toggleActionTokens,
  toggleMenuSelection,
  type MenuAccessFilter,
} from "@/features/groups/menu-access";

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
    icon: "",
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

const MENUS: AdminPortalMenu[] = [
  menu("1", null, 0, {
    label: "Manajemen",
    targetType: "section",
    targetValue: "",
  }),
  menu("10", "1", 0, { label: "Pengguna", targetValue: "/users" }),
  menu("11", "10", 0, { label: "Keamanan", targetValue: "/users/security" }),
  menu("12", "1", 1, { label: "Grup", targetValue: "groups/" }),
  menu("20", null, 1, { label: "Panduan", targetType: "url" }),
];

const NO_FILTER: MenuAccessFilter = { query: "", view: "", selected: [] };

function rowOf(id: string, filter: MenuAccessFilter = NO_FILTER) {
  return buildMenuAccessRows(MENUS, filter).find((row) => row.menu.id === id)!;
}

describe("buildMenuAccessRows", () => {
  it("menyusun baris bertingkat beserta seluruh keturunannya", () => {
    expect(
      buildMenuAccessRows(MENUS, NO_FILTER).map((row) => [
        row.menu.id,
        row.depth,
        row.descendants,
      ]),
    ).toEqual([
      ["1", 0, ["10", "11", "12"]],
      ["10", 1, ["11"]],
      ["11", 2, []],
      ["12", 1, []],
      ["20", 0, []],
    ]);
  });

  it("mempertahankan induk dari menu yang cocok dengan pencarian", () => {
    const rows = buildMenuAccessRows(MENUS, {
      ...NO_FILTER,
      query: "keamanan",
    });

    expect(rows.map((row) => row.menu.id)).toEqual(["1", "10", "11"]);
  });

  it("menampilkan hanya menu terpilih atau belum terpilih", () => {
    const selected = buildMenuAccessRows(MENUS, {
      ...NO_FILTER,
      view: "selected",
      selected: ["12"],
    });
    const unselected = buildMenuAccessRows(MENUS, {
      ...NO_FILTER,
      view: "unselected",
      selected: ["1", "10", "11", "12"],
    });

    expect(selected.map((row) => row.menu.id)).toEqual(["1", "12"]);
    expect(unselected.map((row) => row.menu.id)).toEqual(["20"]);
  });
});

describe("groupMenuAccessColumns", () => {
  it("membuat satu kolom per bagian dan satu kolom tanpa bagian", () => {
    const columns = groupMenuAccessColumns(
      buildMenuAccessRows(MENUS, NO_FILTER),
    );

    expect(
      columns.map((column) => [
        column.section?.menu.id ?? null,
        column.rows.map((row) => row.menu.id),
      ]),
    ).toEqual([
      ["1", ["10", "11", "12"]],
      [null, ["20"]],
    ]);
  });
});

describe("toggleMenuSelection", () => {
  it("memilih submenu beserta induknya, tapi tidak bagiannya", () => {
    expect(toggleMenuSelection([], rowOf("11"), true, MENUS).sort()).toEqual([
      "10",
      "11",
    ]);
  });

  it("melepas menu beserta seluruh submenunya", () => {
    expect(
      toggleMenuSelection(["10", "11", "12"], rowOf("10"), false, MENUS),
    ).toEqual(["12"]);
  });

  it("memilih semua menu di bagian tanpa memilih bagian itu sendiri", () => {
    expect(toggleMenuSelection([], rowOf("1"), true, MENUS).sort()).toEqual([
      "10",
      "11",
      "12",
    ]);
  });

  it("tidak menggandakan menu yang sudah terpilih", () => {
    expect(toggleMenuSelection(["10"], rowOf("11"), true, MENUS)).toEqual([
      "10",
      "11",
    ]);
  });
});

describe("aksi menu", () => {
  const CATALOG: MenuActionDefinition[] = [
    { menuTarget: "users", key: "create", label: "Tambah", description: "" },
    { menuTarget: "users", key: "delete", label: "Hapus", description: "" },
    {
      menuTarget: "groups",
      key: "duplicate",
      label: "Duplikat",
      description: "",
    },
  ];

  it("mencocokkan aksi dengan tujuan menu tanpa memedulikan garis miring", () => {
    expect(
      actionsForMenu(rowOf("10").menu, CATALOG).map((item) => item.key),
    ).toEqual(["create", "delete"]);
    expect(
      actionsForMenu(rowOf("12").menu, CATALOG).map((item) => item.key),
    ).toEqual(["duplicate"]);
  });

  it("tidak memberi aksi untuk bagian dan tautan luar", () => {
    expect(actionsForMenu(rowOf("1").menu, CATALOG)).toEqual([]);
    expect(actionsForMenu(rowOf("20").menu, CATALOG)).toEqual([]);
  });

  it("menambah dan melepas token aksi tanpa duplikat", () => {
    const tokens = [actionToken("10", "create"), actionToken("10", "delete")];
    const added = toggleActionTokens(
      [actionToken("10", "create")],
      tokens,
      true,
    );

    expect(added).toEqual(["10:create", "10:delete"]);
    expect(toggleActionTokens(added, ["10:delete"], false)).toEqual([
      "10:create",
    ]);
  });

  it("hanya menyimpan aksi milik menu yang terpilih", () => {
    expect(
      grantedActions(["10:create", "12:duplicate", "11:delete"], ["10", "11"]),
    ).toEqual([
      { menuId: "10", actionKey: "create" },
      { menuId: "11", actionKey: "delete" },
    ]);
  });
});

describe("utilitas kecil", () => {
  it("membandingkan isi dua daftar tanpa memedulikan urutan", () => {
    expect(sameSet(["1", "2"], ["2", "1"])).toBe(true);
    expect(sameSet(["1"], ["1", "2"])).toBe(false);
  });

  it("menghitung indentasi relatif terhadap bagian", () => {
    expect(menuIndent(2, true)).toBe(20);
    expect(menuIndent(0, false)).toBe(0);
  });
});
