"use client";

import { SearchX } from "lucide-react";
import { ApplicationRow } from "@/components/management/application-table/application-row";
import { PickCheck } from "@/components/management/pick-check";
import { EmptyState } from "@/components/portal/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import type { AdminApplication } from "@/features/applications/admin-api";
import type { ApplicationStatus } from "@/features/applications/application-status";
import type { SortState } from "@/lib/portal/use-server-table";

type ApplicationTableProps = Readonly<{
  rows: readonly AdminApplication[];
  offset: number;
  filtered: boolean;
  sort: SortState;
  allChecked: boolean;
  someChecked: boolean;
  can: (actionKey: string) => boolean;
  isSelected: (id: string) => boolean;
  onSort: (key: string) => void;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onChangeStatus: (
    application: AdminApplication,
    next: ApplicationStatus,
  ) => void;
  onRemove: (application: AdminApplication) => void;
}>;

export function ApplicationTable({
  rows,
  offset,
  filtered,
  sort,
  allChecked,
  someChecked,
  can,
  isSelected,
  onSort,
  onSelectAll,
  onSelect,
  onChangeStatus,
  onRemove,
}: ApplicationTableProps) {
  return (
    <div className="table-wrap">
      <table className="dt ut">
        <thead>
          <tr>
            <th className="ck">
              <PickCheck
                label="Pilih semua di halaman ini"
                checked={allChecked}
                indeterminate={someChecked}
                onChange={onSelectAll}
              />
            </th>
            <th className="ta-c">No</th>
            <SortHeader
              label="Aplikasi"
              sortKey="name"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Kategori"
              sortKey="category"
              sort={sort}
              onSort={onSort}
            />
            <th className="hs">URL</th>
            <SortHeader
              className="hs"
              label="Pengguna"
              sortKey="users"
              sort={sort}
              onSort={onSort}
            />
            <th className="hs">SSO</th>
            <SortHeader
              label="Status"
              sortKey="status"
              sort={sort}
              onSort={onSort}
            />
            <th className="ta-r">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <EmptyState
                  badge={filtered ? SearchX : undefined}
                  title={
                    filtered ? "Aplikasi tidak ditemukan" : "Belum ada aplikasi"
                  }
                  description={
                    filtered
                      ? "Coba ubah kata kunci atau filter."
                      : "Tambahkan aplikasi yang akan dibuka lewat SSO."
                  }
                  inPanel
                />
              </td>
            </tr>
          ) : (
            rows.map((application, index) => (
              <ApplicationRow
                key={application.id}
                application={application}
                number={offset + index + 1}
                selected={isSelected(application.id)}
                can={can}
                onSelect={(checked) => onSelect(application.id, checked)}
                onChangeStatus={(next) => onChangeStatus(application, next)}
                onRemove={() => onRemove(application)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
