"use client";

import { useMemo, useState } from "react";
import {
  History,
  LayoutGrid,
  Search,
  SearchX,
  Star,
  type LucideIcon,
} from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { ApplicationCard } from "@/components/portal/application-card";
import { EmptyState } from "@/components/portal/empty-state";
import {
  BarSkeleton,
  GridSkeleton,
  HeroSkeleton,
  PagerSkeleton,
} from "@/components/portal/skeleton";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import { PageHero } from "@/components/portal/page-hero";
import { DataPager } from "@/components/ui/data-pager";
import { AppStack } from "@/components/portal/app-stack";
import { Icon } from "@/components/ui/icon";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { usePagination } from "@/lib/portal/use-pagination";
import { TomSelect } from "@/components/ui/tom-select";
import { useLauncher } from "@/features/applications/use-launcher";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { useFavoriteToggle } from "@/features/portal/use-favorite-toggle";
import { useMinLoading } from "@/lib/portal/use-min-loading";

type Filter = "all" | "favorites" | "recent";

const SEGMENTS: ReadonlyArray<{
  key: Filter;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "all", label: "Semua", icon: LayoutGrid },
  { key: "favorites", label: "Favorit", icon: Star },
  { key: "recent", label: "Terbaru", icon: History },
];

const EMPTY_COPY: Record<Filter, [string, string]> = {
  all: [
    "Belum ada aplikasi",
    "Hubungi Administrator Sistem untuk mendapatkan akses aplikasi.",
  ],
  favorites: [
    "Belum ada favorit",
    "Tandai aplikasi dengan bintang agar muncul di sini.",
  ],
  recent: [
    "Belum ada aplikasi dibuka",
    "Aplikasi yang Anda buka akan muncul di sini.",
  ],
};

export default function MyApplicationsPage() {
  const { applications, favorites, recent, loading } = usePortalData();
  const toggleFavorite = useFavoriteToggle();
  const { launching, open } = useLauncher();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const showSkeleton = useMinLoading(loading);

  const categories = useMemo(
    () =>
      [
        ...new Set(applications.map((item) => item.category).filter(Boolean)),
      ].sort(),
    [applications],
  );

  const list = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    let items =
      filter === "favorites"
        ? favorites
        : filter === "recent"
          ? recent
          : applications;

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    if (keyword) {
      items = items.filter((item) =>
        `${item.name} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(keyword),
      );
    }

    return items;
  }, [applications, favorites, recent, filter, category, query]);

  const pager = usePagination(list, 9);
  const filtered = Boolean(query.trim() || category);
  function resetFilters() {
    setQuery("");
    setCategory("");
    setFilter("all");
    pager.resetPage();
  }
  const copy = EMPTY_COPY[filter];

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Aplikasi Saya"
          description="Akses cepat ke aplikasi yang tersedia untuk Anda."
        />
      )}

      <div className="card ma-panel">
        {showSkeleton ? (
          <BarSkeleton />
        ) : (
          <div className="ma-bar us-bar">
            <label className="search us-search">
              <Icon icon={Search} size={18} />
              <input
                placeholder="Cari aplikasi"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <div className="segs" role="group" aria-label="Filter aplikasi">
              {SEGMENTS.map((segment) => (
                <button
                  key={segment.key}
                  className={filter === segment.key ? "seg on" : "seg"}
                  type="button"
                  aria-pressed={filter === segment.key}
                  onClick={() => setFilter(segment.key)}
                >
                  <Icon icon={segment.icon} size={15} />
                  {segment.label}
                </button>
              ))}
            </div>

            <div className="seg-select">
              <TomSelect
                ariaLabel="Semua Kategori"
                value={category}
                variant="filter"
                options={[
                  { value: "", label: "Semua Kategori" },
                  ...categories.map((item) => ({ value: item, label: item })),
                ]}
                onChange={setCategory}
              />
            </div>

            <ViewToggle value={view} onChange={setView} />

            <ResetFilterButton onReset={resetFilters} />
          </div>
        )}

        {showSkeleton ? (
          <GridSkeleton cards={9} />
        ) : (
          <div className={view === "list" ? "ma-grid is-list" : "ma-grid"}>
            {list.length === 0 ? (
              <EmptyState
                badge={filtered ? SearchX : undefined}
                title={filtered ? "Tidak ada hasil" : copy[0]}
                description={
                  filtered ? "Coba ubah kata kunci atau kategori." : copy[1]
                }
                inPanel
              />
            ) : (
              pager.rows.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onOpen={open}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </div>
        )}

        {showSkeleton ? (
          <PagerSkeleton />
        ) : (
          <DataPager
            page={pager.page}
            pageSize={pager.pageSize}
            total={list.length}
            unit="aplikasi"
            summary={
              list.length > 0 ? (
                <AppStack
                  applications={list}
                  label={`${list.length} aplikasi`}
                />
              ) : undefined
            }
            sizes={[9, 18, 36]}
            onPage={pager.setPage}
            onPageSize={pager.setPageSize}
          />
        )}
      </div>

      <LaunchOverlay launch={launching} />
    </div>
  );
}
