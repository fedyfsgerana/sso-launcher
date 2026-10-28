"use client";

import { SearchX } from "lucide-react";
import { GroupRow } from "@/components/management/group-table/group-row";
import { PickCheck } from "@/components/management/pick-check";
import { EmptyState } from "@/components/portal/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import type { UserGroup } from "@/features/groups/api";
import type { SortState } from "@/lib/portal/use-server-table";

type GroupTableProps = Readonly<{
  rows: readonly UserGroup[];
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
  onDuplicate: (group: UserGroup) => void;
  onToggleActive: (group: UserGroup) => void;
  onRemove: (group: UserGroup) => void;
}>;

export function GroupTable({
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
  onDuplicate,
  onToggleActive,
  onRemove,
}: GroupTableProps) {
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
              label="Grup"
              sortKey="name"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Departemen"
              sortKey="department"
              sort={sort}
              onSort={onSort}
            />
            <th className="hs">Keterangan</th>
            <SortHeader
              className="hs"
              label="Pengguna"
              sortKey="members"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Aplikasi"
              sortKey="applications"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Menu"
              sortKey="menus"
              sort={sort}
              onSort={onSort}
            />
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
              <td colSpan={10}>
                <EmptyState
                  badge={filtered ? SearchX : undefined}
                  title={filtered ? "Grup tidak ditemukan" : "Belum ada grup"}
                  description={
                    filtered
                      ? "Coba ubah kata kunci atau filter."
                      : "Tambahkan grup untuk mengelompokkan pengguna."
                  }
                  inPanel
                />
              </td>
            </tr>
          ) : (
            rows.map((group, index) => (
              <GroupRow
                key={group.id}
                group={group}
                number={offset + index + 1}
                selected={isSelected(group.id)}
                can={can}
                onSelect={(checked) => onSelect(group.id, checked)}
                onDuplicate={() => onDuplicate(group)}
                onToggleActive={() => onToggleActive(group)}
                onRemove={() => onRemove(group)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
