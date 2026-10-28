"use client";

import { useEffect, useState } from "react";
import { AuditStats } from "@/components/management/audit-table/audit-stats";
import { AuditTable } from "@/components/management/audit-table/audit-table";
import {
  AuditTabs,
  type AuditTab,
} from "@/components/management/audit-table/audit-tabs";
import { AuditToolbar } from "@/components/management/audit-table/audit-toolbar";
import {
  AuditDetailModal,
  type VersionTarget,
} from "@/components/management/audit-detail-modal";
import { RecycleBinPanel } from "@/components/management/recycle-bin-panel";
import { VersionHistoryModal } from "@/components/management/version-history-modal";
import { PageHero } from "@/components/portal/page-hero";
import {
  BarSkeleton,
  HeroSkeleton,
  PagerSkeleton,
  TabBarSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import {
  getAuditActors,
  getAuditSummary,
  type AuditActor,
  type AuditLog,
  type AuditSummary,
} from "@/features/audit/api";
import {
  EMPTY_AUDIT_FILTERS,
  auditQueryFilters,
  fetchAuditPage,
  hasAuditFilters,
  type AuditFilterState,
} from "@/features/audit/audit-filters";
import { useAuditExport } from "@/features/audit/use-audit-export";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { useServerTable } from "@/lib/portal/use-server-table";

const EMPTY_SUMMARY: AuditSummary = {
  today: 0,
  lastSevenDays: 0,
  deletionsLastSevenDays: 0,
  failedLastSevenDays: 0,
};

export default function AuditPage() {
  const { can } = useMenuActions("audit");
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS);
  const [tab, setTab] = useState<AuditTab>("activity");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<VersionTarget | null>(
    null,
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [summary, setSummary] = useState<AuditSummary>(EMPTY_SUMMARY);
  const [actors, setActors] = useState<AuditActor[]>([]);
  const table = useServerTable<AuditLog>({
    fetchPage: fetchAuditPage,
    filters: auditQueryFilters(filters),
  });
  const showSkeleton = useMinLoading(table.loading);
  const exporter = useAuditExport();
  const filtered = Boolean(table.search.trim()) || hasAuditFilters(filters);

  useEffect(() => {
    let active = true;

    void getAuditActors()
      .catch(() => [] as AuditActor[])
      .then((nextActors) => {
        if (active) {
          setActors(nextActors);
        }
      });

    void getAuditSummary()
      .then((value) => {
        if (active) {
          setSummary(value);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [reloadToken]);

  function setFilter(key: keyof AuditFilterState, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    table.resetPage();
  }

  function resetFilters() {
    table.setSearch("");
    setFilters(EMPTY_AUDIT_FILTERS);
  }

  function afterDataChanged() {
    table.reload();
    setReloadToken((value) => value + 1);
  }

  function showHistory(target: VersionTarget) {
    setSelectedId(null);
    setHistoryTarget(target);
  }

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Riwayat Aktivitas"
          description="Telusuri aktivitas, histori versi, dan tempat sampah."
        />
      )}

      {showSkeleton ? null : <AuditStats summary={summary} />}

      <div className="card audit-shell">
        {showSkeleton ? (
          <TabBarSkeleton />
        ) : (
          <AuditTabs tab={tab} onChange={setTab} />
        )}

        {tab === "trash" ? (
          <RecycleBinPanel
            reloadToken={reloadToken}
            onShowHistory={showHistory}
            onRestored={afterDataChanged}
          />
        ) : (
          <div className="ma-panel">
            {showSkeleton ? (
              <BarSkeleton />
            ) : (
              <AuditToolbar
                query={table.search}
                filters={filters}
                actors={actors}
                canExport={can("export")}
                exporting={exporter.exporting}
                onQueryChange={table.setSearch}
                onFilterChange={setFilter}
                onReset={resetFilters}
                onExport={() =>
                  void exporter.exportExcel({
                    filters,
                    search: table.search,
                    sort: table.sort,
                  })
                }
              />
            )}

            {showSkeleton ? (
              <TableSkeleton rows={Math.min(table.pageSize, 10)} columns={7} />
            ) : (
              <AuditTable
                rows={table.items}
                offset={table.offset}
                filtered={filtered}
                sort={table.sort}
                onSort={table.toggleSort}
                onOpen={setSelectedId}
              />
            )}

            {showSkeleton ? (
              <PagerSkeleton />
            ) : (
              <DataPager
                page={table.page}
                pageSize={table.pageSize}
                total={table.total}
                unit="catatan"
                onPage={table.setPage}
                onPageSize={table.setPageSize}
              />
            )}
          </div>
        )}
      </div>

      <AuditDetailModal
        logId={selectedId}
        onClose={() => setSelectedId(null)}
        onShowHistory={showHistory}
      />

      <VersionHistoryModal
        key={
          historyTarget
            ? `${historyTarget.entityType}:${historyTarget.entityId}`
            : "none"
        }
        target={historyTarget}
        onClose={() => setHistoryTarget(null)}
        onChanged={afterDataChanged}
      />
    </div>
  );
}
