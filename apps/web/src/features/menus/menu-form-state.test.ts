import { describe, expect, it } from "vitest";
import type { AdminPortalMenu } from "@/features/menus/admin-api";
import {
  EMPTY_MENU_FORM,
  defaultTargetValue,
  menuAccessLink,
  menuFormFromMenu,
  menuPayload,
  normalizeInternalPath,
  parentOptions,
  parentSectionLabel,
  placementUnder,
  sectionOptions,
  validateMenuForm,
} from "@/features/menus/menu-form-state";

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
    targetValue: "overview",
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
  menu("10", "2", 0, { label: "Pengguna" }),
  menu("11", "10", 0, { label: "Keamanan" }),
  menu("12", "11", 0, { label: "Kunci Login" }),
  menu("20", "1", 0, { label: "Laporan" }),
];

describe("normalizeInternalPath dan defaultTargetValue", () => {
  it("menambahkan garis miring di depan path internal", () => {
    expect(normalizeInternalPath(" reports/monthly ")).toBe("/reports/monthly");
    expect(normalizeInternalPath("/reports")).toBe("/reports");
    expect(normalizeInternalPath("   ")).toBe("");
  });

  it("memberi nilai bawaan sesuai jenis link", () => {
    expect(defaultTargetValue("page")).toBe("overview");
    expect(defaultTargetValue("url")).toBe("");
    expect(defaultTargetValue("custom")).toBe("/");
  });
});

describe("placementUnder", () => {
  it("menempatkan menu baru sebagai menu utama di bawah bagian", () => {
    expect(placementUnder(MENUS, "2")).toEqual({
      level: 0,
      sectionId: "2",
      parentId: "",
    });
  });

  it("menempatkan menu baru satu tingkat di bawah menu induk", () => {
    expect(placementUnder(MENUS, "11")).toEqual({
      level: 2,
      sectionId: "2",
      parentId: "11",
    });
  });

  it("mengabaikan induk yang tidak ada", () => {
    expect(placementUnder(MENUS, "99")).toBeNull();
  });
});

describe("menuFormFromMenu", () => {
  it("mengisi bagian dan induk dari posisi menu", () => {
    expect(menuFormFromMenu(MENUS, MENUS[3])).toMatchObject({
      label: "Keamanan",
      sectionId: "2",
      parentId: "10",
    });
  });

  it("mengosongkan induk untuk menu utama", () => {
    expect(menuFormFromMenu(MENUS, MENUS[2]).parentId).toBe("");
  });
});

describe("pilihan bagian dan menu induk", () => {
  it("mengurutkan bagian sesuai sortOrder", () => {
    expect(sectionOptions(MENUS)).toEqual([
      { value: "2", label: "Manajemen" },
      { value: "1", label: "Utama" },
    ]);
  });

  it("hanya menawarkan menu satu tingkat di atasnya beserta jalur dan bagiannya", () => {
    expect(parentOptions(MENUS, 1)).toEqual([
      { value: "20", label: "Laporan (Utama)" },
      { value: "10", label: "Pengguna (Manajemen)" },
    ]);
    expect(parentOptions(MENUS, 2)).toEqual([
      { value: "11", label: "Pengguna / Keamanan (Manajemen)" },
    ]);
  });

  it("tidak menawarkan menu itu sendiri maupun keturunannya", () => {
    expect(parentOptions(MENUS, 2, "11")).toEqual([]);
  });

  it("tidak menawarkan induk untuk menu utama", () => {
    expect(parentOptions(MENUS, 0)).toEqual([]);
  });

  it("menampilkan bagian dari menu induk terpilih", () => {
    expect(parentSectionLabel(MENUS, "11")).toBe("Manajemen");
    expect(parentSectionLabel(MENUS, "")).toBe("");
  });
});

describe("validateMenuForm", () => {
  it("mewajibkan bagian untuk menu utama dan induk untuk submenu", () => {
    expect(
      validateMenuForm(EMPTY_MENU_FORM, { level: 0, hasChildren: false })
        .sectionId,
    ).toBe("Pilih bagian");
    expect(
      validateMenuForm(EMPTY_MENU_FORM, { level: 1, hasChildren: false })
        .parentId,
    ).toBe("Pilih menu induk");
  });

  it("memeriksa URL untuk tautan eksternal", () => {
    const form = {
      ...EMPTY_MENU_FORM,
      targetType: "url",
      targetValue: "bukan-url",
    };

    expect(
      validateMenuForm(form, { level: 0, hasChildren: false }).targetValue,
    ).toBeTruthy();
  });

  it("tidak memeriksa link untuk menu yang punya submenu", () => {
    const form = { ...EMPTY_MENU_FORM, targetType: "url", targetValue: "" };

    expect(
      validateMenuForm(form, { level: 0, hasChildren: true }).targetValue,
    ).toBeUndefined();
  });
});

describe("menuPayload dan menuAccessLink", () => {
  const base = {
    ...EMPTY_MENU_FORM,
    label: " Laporan Bulanan ",
    sectionId: "1",
    parentId: "20",
  };

  it("memakai bagian sebagai induk untuk menu utama dan menu induk untuk submenu", () => {
    expect(menuPayload(base, 0).parentId).toBe("1");
    expect(menuPayload(base, 1).parentId).toBe("20");
    expect(menuPayload({ ...base, sectionId: "" }, 0).parentId).toBeNull();
  });

  it("merapikan nama dan path internal sebelum dikirim", () => {
    const payload = menuPayload(
      { ...base, targetType: "custom", targetValue: "reports/monthly" },
      0,
    );

    expect(payload.label).toBe("Laporan Bulanan");
    expect(payload.targetValue).toBe("/reports/monthly");
  });

  it("menampilkan link akses akhir sesuai jenis link", () => {
    expect(menuAccessLink(base)).toBe("/overview");
    expect(
      menuAccessLink({
        ...base,
        targetType: "url",
        targetValue: "https://example.com",
      }),
    ).toBe("https://example.com");
  });
});
