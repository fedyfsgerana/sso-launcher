"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, Star } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { ApplicationCard } from "@/components/portal/application-card";
import { EmptyState } from "@/components/portal/empty-state";
import { FavoriteModal } from "@/components/portal/favorite-modal";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import { PageHero } from "@/components/portal/page-hero";
import {
  BarSkeleton,
  GridSkeleton,
  HeroSkeleton,
  PagerSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import { AppStack } from "@/components/portal/app-stack";
import { Icon } from "@/components/ui/icon";
import { usePagination } from "@/lib/portal/use-pagination";
import { TomSelect } from "@/components/ui/tom-select";
import { useLauncher } from "@/features/applications/use-launcher";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { useFavoriteToggle } from "@/features/portal/use-favorite-toggle";
import { useMinLoading } from "@/lib/portal/use-min-loading";

export default function FavoritesPage() {
  const { applications, favorites, loading } = usePortalData();
  const { launching, open } = useLauncher();
  const toggleFavorite = useFavoriteToggle();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const showSkeleton = useMinLoading(loading);

  const categories = useMemo(
    () =>
      [
        ...new Set(favorites.map((item) => item.category).filter(Boolean)),
      ].sort(),
    [favorites],
  );

  const list = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return favorites.filter((application) => {
      if (category && application.category !== category) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return `${application.name} ${application.description} ${application.category}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [favorites, query, category]);

  const filtered = Boolean(query.trim() || category);

  const pager = usePagination(list, 9);

  function resetFilters() {
    setQuery("");
    setCategory("");
    pager.resetPage();
  }

  const hasApplications = applications.length > 0;
  const canAdd = applications.some((application) => !application.isFavorite);

  const addButton = (
    <button
      className="btn tone-warn"
      type="button"
      disabled={!canAdd}
      title={
        !hasApplications
          ? "Belum ada aplikasi yang bisa Anda buka"
          : !canAdd
            ? "Semua aplikasi Anda sudah ada di Favorit"
            : undefined
      }
      onClick={() => setModalOpen(true)}
    >
      Tambah Favorit
      <Icon icon={Star} size={18} />
    </button>
  );

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Favorit"
          description="Akses cepat ke aplikasi yang paling sering Anda gunakan."
          actions={addButton}
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

            <ResetFilterButton onReset={resetFilters} />
          </div>
        )}

        {showSkeleton ? (
          <GridSkeleton cards={3} />
        ) : (
          <div className="ma-grid">
            {list.length === 0 ? (
              <EmptyState
                badge={filtered ? SearchX : undefined}
                title={filtered ? "Tidak ada hasil" : "Belum ada favorit"}
                description={
                  filtered
                    ? "Coba ubah kata kunci atau kategori."
                    : hasApplications
                      ? "Tambahkan aplikasi yang sering Anda pakai agar mudah diakses."
                      : "Belum ada aplikasi yang bisa Anda buka. Hubungi admin untuk mendapatkan akses."
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
            unit="favorit"
            summary={
              list.length > 0 ? (
                <AppStack
                  applications={list}
                  label={`${list.length} favorit`}
                />
              ) : undefined
            }
            sizes={[9, 18, 36]}
            onPage={pager.setPage}
            onPageSize={pager.setPageSize}
          />
        )}
      </div>

      <FavoriteModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <LaunchOverlay launch={launching} />
    </div>
  );
}
