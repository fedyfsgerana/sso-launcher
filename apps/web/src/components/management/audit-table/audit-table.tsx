"use client";

import { SearchX } from "lucide-react";
import { AuditRow } from "@/components/management/audit-table/audit-row";
import { EmptyState } from "@/components/portal/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import type { AuditLog } from "@/features/audit/api";
import type { SortState } from "@/lib/portal/use-server-table";

type AuditTableProps = Readonly<{
  rows: readonly AuditLog[];
  offset: number;
  filtered: boolean;
  sort: SortState;
  onSort: (key: string) => void;
  onOpen: (logId: string) => void;
}>;

export function AuditTable({
  rows,
  offset,
  filtered,
  sort,
  onSort,
  onOpen,
}: AuditTableProps) {
  return (
    <div className="table-wrap">
      <table className="dt ut">
        <thead>
          <tr>
            <th className="ta-c">No</th>
            <SortHeader
              label="Dilakukan Oleh"
              sortKey="actor"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              label="Aksi"
              sortKey="action"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Data Terkait"
              sortKey="target"
              sort={sort}
              onSort={onSort}
            />
            <th className="hs">Keterangan</th>
            <th className="hs">Perangkat</th>
            <SortHeader
              className="ta-r"
              label="Waktu"
              sortKey="occurredAt"
              sort={sort}
              onSort={onSort}
            />
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  badge={filtered ? SearchX : undefined}
                  title={
                    filtered ? "Riwayat tidak ditemukan" : "Belum ada riwayat"
                  }
                  description={
                    filtered
                      ? "Coba ubah kata kunci atau filter."
                      : "Setiap aktivitas akan tercatat di sini."
                  }
                  inPanel
                />
              </td>
            </tr>
          ) : (
            rows.map((log, index) => (
              <AuditRow
                key={log.id}
                log={log}
                number={offset + index + 1}
                onOpen={() => onOpen(log.id)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
