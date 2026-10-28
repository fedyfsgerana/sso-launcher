"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ApplicationBulkBar } from "@/components/management/application-table/application-bulk-bar";
import { ApplicationTable } from "@/components/management/application-table/application-table";
import { ApplicationToolbar } from "@/components/management/application-table/application-toolbar";
import { PageHero } from "@/components/portal/page-hero";
import { Icon } from "@/components/ui/icon";
import {
  BarSkeleton,
  HeroSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import {
  getAdminApplicationsPage,
  getApplicationsSummary,
  type AdminApplication,
  type ApplicationSummary,
} from "@/features/applications/admin-api";
import { useApplicationActions } from "@/features/applications/use-application-actions";
import { useDepartments } from "@/features/departments/use-departments";
import { applicationCategories } from "@/lib/portal/options";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { useRowSelection } from "@/lib/portal/use-row-selection";
import { useServerTable } from "@/lib/portal/use-server-table";

const EMPTY_SUMMARY: ApplicationSummary = {
  total: 0,
  active: 0,
  maintenance: 0,
  inactive: 0,
};

export default function ApplicationsPage() {
  const { can } = useMenuActions("applications");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<ApplicationSummary>(EMPTY_SUMMARY);
  const table = useServerTable<AdminApplication>({
    fetchPage: getAdminApplicationsPage,
    filters: { status, category },
  });
  const showSkeleton = useMinLoading(table.loading);
  const { departments } = useDepartments();
  const categories = applicationCategories(departments);
  const applications = table.items;
  const filtered = Boolean(table.search.trim() || category || status);
  const selection = useRowSelection(
    applications.map((application) => application.id),
  );

  function loadSummary() {
    void getApplicationsSummary()
      .then(setSummary)
      .catch(() => undefined);
  }

  useEffect(() => {
    let active = true;

    void getApplicationsSummary()
      .then((value) => {
        if (active) {
          setSummary(value);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  function reload() {
    table.reload();
    loadSummary();
  }

  const actions = useApplicationActions({
    onChanged: reload,
    onBulkDone: selection.clear,
  });

  function resetFilters() {
    table.setSearch("");
    setCategory("");
    setStatus("");
  }

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Manajemen Aplikasi"
          description="Daftarkan aplikasi yang dibuka lewat SSO."
          actions={
            can("create") ? (
              <Link className="btn" href="/applications/new">
                Tambah Aplikasi
                <Icon icon={Plus} size={18} />
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="card ma-panel">
        {showSkeleton ? (
          <BarSkeleton />
        ) : (
          <ApplicationToolbar
            query={table.search}
            status={status}
            counts={summary}
            category={category}
            categories={categories}
            canCreate={false}
            onQueryChange={table.setSearch}
            onStatusChange={(value) => {
              setStatus(value);
              table.resetPage();
            }}
            onCategoryChange={(value) => {
              setCategory(value);
              table.resetPage();
            }}
            onReset={resetFilters}
          />
        )}

        {selection.selected.length > 0 ? (
          <ApplicationBulkBar
            count={selection.selected.length}
            canUpdate={can("update")}
            canDelete={can("delete")}
            onAction={(action) =>
              void actions.bulk(
                applications.filter((application) =>
                  selection.isSelected(application.id),
                ),
                action,
              )
            }
          />
        ) : null}

        {showSkeleton ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <ApplicationTable
            rows={applications}
            offset={table.offset}
            filtered={filtered}
            sort={table.sort}
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            can={can}
            isSelected={selection.isSelected}
            onSort={table.toggleSort}
            onSelectAll={selection.toggleAll}
            onSelect={selection.toggleOne}
            onChangeStatus={(application, next) =>
              void actions.changeStatus(application, next)
            }
            onRemove={(application) => void actions.remove(application)}
          />
        )}

        {showSkeleton ? (
          <PagerSkeleton />
        ) : (
          <DataPager
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            unit="aplikasi"
            onPage={(next) => {
              selection.clear();
              table.setPage(next);
            }}
            onPageSize={(size) => {
              selection.clear();
              table.setPageSize(size);
            }}
          />
        )}
      </div>
    </div>
  );
}
