"use client";

import { useEffect, useState } from "react";

import { AuditDetailModal } from "@/components/management/audit-detail-modal";
import { SortHeader } from "@/components/ui/sort-header";
import type { SortState } from "@/lib/portal/use-server-table";
import { EmptyState } from "@/components/portal/empty-state";
import { TableSkeleton } from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import { Icon } from "@/components/ui/icon";
import { getAuditLogs, type AuditLogPage } from "@/features/audit/api";
import {
  actionIcon,
  actionLabel,
  actionTone,
  targetLabel,
} from "@/lib/portal/audit-options";
import { formatRelative, initials } from "@/lib/portal/format";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { avatarColorClass } from "@/lib/portal/palette";

const EMPTY: AuditLogPage = { items: [], total: 0, page: 1, pageSize: 10 };

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

type UserHistoryPanelProps = Readonly<{
  userId: string;
}>;

export function UserHistoryPanel({ userId }: UserHistoryPanelProps) {
  const [data, setData] = useState<AuditLogPage>(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const showSkeleton = useMinLoading(loading);

  useEffect(() => {
    let active = true;

    void getAuditLogs({
      page,
      pageSize,
      targetType: "user",
      targetId: userId,
      sort: sort?.key,
      direction: sort?.direction,
    })
      .catch(() => EMPTY)
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, userId, sort]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key !== key
        ? { key, direction: "asc" }
        : current.direction === "asc"
          ? { key, direction: "desc" }
          : null,
    );
    setPage(1);
  }

  const offset = (data.page - 1) * data.pageSize;

  return (
    <div className="pk-panel">
      {showSkeleton ? null : (
        <div className="pk-info">
          <span>
            Aktivitas tercatat <b>{data.total}</b>
          </span>
          <span className="pk-hint">
            Aktivitas pengguna ini di SSO Launcher, yang terbaru di atas. Klik
            baris untuk melihat detailnya.
          </span>
        </div>
      )}

      {showSkeleton ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <div className="table-wrap">
          <table className="dt ut">
            <thead>
              <tr>
                <th className="ta-c">No</th>
                <SortHeader
                  label="Aksi"
                  sortKey="action"
                  sort={sort}
                  onSort={toggleSort}
                />
                <th className="hs">Keterangan</th>
                <SortHeader
                  label="Dilakukan Oleh"
                  sortKey="actor"
                  sort={sort}
                  onSort={toggleSort}
                />
                <SortHeader
                  className="ta-r"
                  label="Waktu"
                  sortKey="occurredAt"
                  sort={sort}
                  onSort={toggleSort}
                />
              </tr>
            </thead>

            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="Belum ada riwayat"
                      description="Perubahan pada pengguna ini akan tercatat di sini."
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((log, index) => (
                  <tr
                    key={log.id}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    title="Lihat detail aktivitas"
                    onClick={() => setSelectedId(log.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(log.id);
                      }
                    }}
                  >
                    <td className="ta-c">
                      <span className="row-no">{offset + index + 1}</span>
                    </td>
                    <td>
                      <span
                        className={`status ${actionTone(log.action, log.outcome)}`}
                      >
                        <Icon icon={actionIcon(log.action)} size={13} />
                        {actionLabel(log.action)}
                      </span>
                      <small className="muted hist-type">
                        {targetLabel(log.targetType)}
                      </small>
                    </td>
                    <td className="muted hs">{log.summary || "-"}</td>
                    <td>
                      <div className="who">
                        <span
                          className={`av ${avatarColorClass(log.actorName)}`}
                        >
                          {initials(log.actorName)}
                        </span>
                        <div>
                          <b>{log.actorName}</b>
                        </div>
                      </div>
                    </td>
                    <td className="ta-r">
                      <span
                        className="muted"
                        title={dateTime.format(new Date(log.occurredAt))}
                      >
                        {formatRelative(log.occurredAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DataPager
        page={data.page}
        pageSize={pageSize}
        total={data.total}
        unit="catatan"
        onPage={(next) => {
          setLoading(true);
          setPage(next);
        }}
        onPageSize={(next) => {
          setLoading(true);
          setPageSize(next);
          setPage(1);
        }}
      />

      <AuditDetailModal
        logId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
