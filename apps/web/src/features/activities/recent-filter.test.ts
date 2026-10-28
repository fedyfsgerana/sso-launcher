import { describe, expect, it } from "vitest";
import {
  EMPTY_RECENT_FILTER,
  filterRecentActivities,
  isRecentFiltered,
  openedApplications,
  usedCategories,
} from "@/features/activities/recent-filter";
import type { PortalActivity, PortalApplication } from "@/types/portal";

const NOW = new Date(2026, 9, 6, 15, 0, 0);

function hoursAgo(hours: number) {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString();
}

function application(
  id: string,
  category: string,
  isFavorite: boolean,
): PortalApplication {
  return {
    id,
    name: `Aplikasi ${id}`,
    slug: `aplikasi-${id}`,
    description: "",
    launchUrl: `https://${id}.example.test`,
    category,
    icon: "",
    color: "green",
    status: "active",
    maintenanceMessage: "",
    usesSso: true,
    isFavorite,
    lastOpenedAt: null,
  };
}

function activity(
  id: string,
  applicationId: string | null,
  title: string,
  occurredAt: string,
): PortalActivity {
  return {
    id,
    kind: "application",
    applicationId,
    title,
    subtitle: "",
    targetPath: applicationId ? null : "/settings",
    occurredAt,
  };
}

const APPLICATIONS = [
  application("1", "Keuangan", true),
  application("2", "Produksi", false),
];

const ACTIVITIES = [
  activity("a", "1", "ERP", hoursAgo(1)),
  activity("b", "2", "Produksi Harian", hoursAgo(30)),
  activity("c", null, "Pengaturan", hoursAgo(24 * 10)),
  activity("d", "1", "ERP", hoursAgo(24 * 3)),
];

function ids(items: readonly PortalActivity[]) {
  return items.map((item) => item.id);
}

function filterWith(filter: Partial<typeof EMPTY_RECENT_FILTER>) {
  return ids(
    filterRecentActivities(
      ACTIVITIES,
      APPLICATIONS,
      { ...EMPTY_RECENT_FILTER, ...filter },
      NOW,
    ),
  );
}

describe("filterRecentActivities", () => {
  it("mengembalikan semua aktivitas tanpa filter", () => {
    expect(filterWith({})).toEqual(["a", "b", "c", "d"]);
  });

  it("memfilter berdasarkan kata kunci tanpa membedakan huruf besar kecil", () => {
    expect(filterWith({ query: "  erp " })).toEqual(["a", "d"]);
  });

  it("memfilter berdasarkan kategori aplikasi", () => {
    expect(filterWith({ category: "Produksi" })).toEqual(["b"]);
  });

  it("memisahkan aplikasi favorit dan bukan favorit", () => {
    expect(filterWith({ favorite: "yes" })).toEqual(["a", "d"]);
    expect(filterWith({ favorite: "no" })).toEqual(["b", "c"]);
  });

  it("memfilter aktivitas hari ini dan 7 hari terakhir", () => {
    expect(filterWith({ period: "today" })).toEqual(["a"]);
    expect(filterWith({ period: "week" })).toEqual(["a", "b", "d"]);
  });

  it("tidak memfilter waktu sebelum jam tersedia", () => {
    expect(
      ids(
        filterRecentActivities(
          ACTIVITIES,
          APPLICATIONS,
          { ...EMPTY_RECENT_FILTER, period: "today" },
          null,
        ),
      ),
    ).toEqual(["a", "b", "c", "d"]);
  });
});

describe("ringkasan aktivitas terbaru", () => {
  it("mendeteksi filter aktif", () => {
    expect(isRecentFiltered(EMPTY_RECENT_FILTER)).toBe(false);
    expect(isRecentFiltered({ ...EMPTY_RECENT_FILTER, period: "week" })).toBe(
      true,
    );
  });

  it("menyusun aplikasi unik yang pernah dibuka", () => {
    expect(
      openedApplications(ACTIVITIES, APPLICATIONS).map((item) => item.id),
    ).toEqual(["1", "2"]);
  });

  it("mengumpulkan kategori yang pernah dipakai", () => {
    expect([...usedCategories(ACTIVITIES, APPLICATIONS)].sort()).toEqual([
      "Keuangan",
      "Produksi",
    ]);
  });
});
