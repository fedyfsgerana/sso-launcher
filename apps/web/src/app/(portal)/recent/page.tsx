"use client";

import { useMemo, useState } from "react";
import { SearchX, Trash2 } from "lucide-react";
import { AppStack } from "@/components/portal/app-stack";
import { EmptyState } from "@/components/portal/empty-state";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import { PageHero } from "@/components/portal/page-hero";
import { RecentHead } from "@/components/portal/recent/recent-head";
import { RecentRow } from "@/components/portal/recent/recent-row";
import { RecentTips } from "@/components/portal/recent/recent-tips";
import { RecentToolbar } from "@/components/portal/recent/recent-toolbar";
import { DataPager } from "@/components/ui/data-pager";
import { Icon } from "@/components/ui/icon";
import {
  EMPTY_RECENT_FILTER,
  filterRecentActivities,
  isRecentFiltered,
  openedApplications as listOpenedApplications,
  usedCategories,
  type RecentFilter,
} from "@/features/activities/recent-filter";
import { useRecentActions } from "@/features/activities/use-recent-actions";
import { useLauncher } from "@/features/applications/use-launcher";
import { useDepartments } from "@/features/departments/use-departments";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { useFavoriteToggle } from "@/features/portal/use-favorite-toggle";
import { applicationCategories, sortCategories } from "@/lib/portal/options";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useClientSort } from "@/lib/portal/use-client-sort";
import { useClock } from "@/lib/portal/use-clock";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { usePagination } from "@/lib/portal/use-pagination";
import { useRowSelection } from "@/lib/portal/use-row-selection";
import type { PortalActivity } from "@/types/portal";
import { RecentSkeleton } from "./recent-skeleton";

const RECENT_SORTERS: Readonly<
  Record<string, (activity: PortalActivity) => string | number>
> = {
  name: (activity) => activity.title,
  time: (activity) => new Date(activity.occurredAt).getTime(),
};

export default function RecentPage() {
  const router = useAppRouter();
  const { departments } = useDepartments();
  const { activities, applications, loading } = usePortalData();
  const showSkeleton = useMinLoading(loading);
  const { launching, open } = useLauncher();
  const toggleFavorite = useFavoriteToggle();
  const [filter, setFilter] = useState<RecentFilter>(EMPTY_RECENT_FILTER);
  const clock = useClock();

  const list = useMemo(
    () => filterRecentActivities(activities, applications, filter, clock),
    [activities, applications, filter, clock],
  );
  const { sorted, sort, toggleSort } = useClientSort(list, RECENT_SORTERS);
  const pager = usePagination(sorted, 10);
  const selection = useRowSelection(pager.rows.map((activity) => activity.id));
  const existingIds = new Set(activities.map((activity) => activity.id));
  const chosen = selection.selected.filter((id) => existingIds.has(id));
  const actions = useRecentActions({ onRemovedMany: selection.clear });
  const filtered = isRecentFiltered(filter);

  const openedApplications = useMemo(
    () => listOpenedApplications(list, applications),
    [applications, list],
  );

  const categoryOptions = useMemo(
    () =>
      sortCategories(
        usedCategories(activities, applications),
        applicationCategories(departments),
      ).map((item) => ({ value: item, label: item })),
    [activities, applications, departments],
  );

  function changeFilter(update: Partial<RecentFilter>) {
    setFilter((current) => ({ ...current, ...update }));
    pager.resetPage();
  }

  function resetFilters() {
    setFilter(EMPTY_RECENT_FILTER);
    pager.resetPage();
  }

  function applicationOf(activity: PortalActivity) {
    return applications.find((item) => item.id === activity.applicationId);
  }

  function handleOpen(activity: PortalActivity) {
    const application = applicationOf(activity);

    if (application) {
      void open(application);
      return;
    }

    if (activity.targetPath) {
      router.push(activity.targetPath);
    }
  }

  if (showSkeleton) {
    return <RecentSkeleton />;
  }

  return (
    <div className="page">
      <PageHero
        title="Terbaru"
        description="Akses aplikasi yang terakhir Anda buka lewat portal."
      />

      <div className="rc-layout">
        <div className="card rc-table">
          <RecentToolbar
            filter={filter}
            categories={categoryOptions}
            canClear={activities.length > 0}
            onChange={changeFilter}
            onReset={resetFilters}
            onClear={() => void actions.clearAll()}
          />

          {chosen.length > 0 ? (
            <div className="bulk">
              <span>{chosen.length} aktivitas dipilih</span>

              <button
                className="ac-btn danger"
                type="button"
                disabled={actions.removing}
                onClick={() => void actions.removeMany(chosen)}
              >
                Hapus dari Riwayat
                <Icon icon={Trash2} size={15} />
              </button>
            </div>
          ) : null}

          <RecentHead
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            sort={sort}
            onSelectAll={selection.toggleAll}
            onSort={(key) => {
              toggleSort(key);
              pager.resetPage();
            }}
          />

          <div>
            {list.length === 0 ? (
              <EmptyState
                badge={filtered ? SearchX : undefined}
                title={filtered ? "Tidak ada hasil" : "Riwayat masih kosong"}
                description={
                  filtered
                    ? "Coba ubah kata kunci atau filter."
                    : "Aplikasi yang Anda buka akan muncul di sini."
                }
                inPanel
              />
            ) : (
              pager.rows.map((activity, index) => (
                <RecentRow
                  key={activity.id}
                  activity={activity}
                  application={applicationOf(activity)}
                  number={pager.offset + index + 1}
                  selected={selection.isSelected(activity.id)}
                  onSelect={(checked) =>
                    selection.toggleOne(activity.id, checked)
                  }
                  onOpen={() => handleOpen(activity)}
                  onToggleFavorite={(applicationId) =>
                    void toggleFavorite(applicationId)
                  }
                  onRemove={() => void actions.removeOne(activity)}
                />
              ))
            )}
          </div>

          <DataPager
            page={pager.page}
            pageSize={pager.pageSize}
            total={list.length}
            unit="aktivitas"
            summary={
              list.length > 0 ? (
                <AppStack
                  applications={openedApplications}
                  label={`${list.length} aktivitas dari ${openedApplications.length} aplikasi`}
                />
              ) : undefined
            }
            onPage={pager.setPage}
            onPageSize={pager.setPageSize}
          />
        </div>

        <RecentTips
          total={activities.length}
          onShowFavorites={() => router.push("/favorites")}
        />
      </div>

      <LaunchOverlay launch={launching} />
    </div>
  );
}
