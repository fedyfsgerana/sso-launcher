"use client";

import { SearchX } from "lucide-react";
import { UserRow } from "@/components/management/user-table/user-row";
import { PickCheck } from "@/components/management/pick-check";
import { EmptyState } from "@/components/portal/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import type { PortalUser } from "@/features/users/api";
import type { SortState } from "@/lib/portal/use-server-table";

type UserTableProps = Readonly<{
  rows: readonly PortalUser[];
  offset: number;
  sort: SortState;
  allChecked: boolean;
  someChecked: boolean;
  can: (actionKey: string) => boolean;
  isSelected: (id: string) => boolean;
  onSort: (key: string) => void;
  onSelectAll: (checked: boolean) => void;
  onSelect: (id: string, checked: boolean) => void;
  onToggleActive: (user: PortalUser) => void;
  onRemove: (user: PortalUser) => void;
}>;

export function UserTable({
  rows,
  offset,
  sort,
  allChecked,
  someChecked,
  can,
  isSelected,
  onSort,
  onSelectAll,
  onSelect,
  onToggleActive,
  onRemove,
}: UserTableProps) {
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
              label="Nama"
              sortKey="name"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="NIK"
              sortKey="employeeNumber"
              sort={sort}
              onSort={onSort}
            />
            <SortHeader
              className="hs"
              label="Email"
              sortKey="email"
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
            <th className="hs">Grup</th>
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
                  badge={SearchX}
                  title="Pengguna tidak ditemukan"
                  description="Coba ubah kata kunci atau filter."
                  inPanel
                />
              </td>
            </tr>
          ) : (
            rows.map((user, index) => (
              <UserRow
                key={user.id}
                user={user}
                number={offset + index + 1}
                selected={isSelected(user.id)}
                can={can}
                onSelect={(checked) => onSelect(user.id, checked)}
                onToggleActive={() => onToggleActive(user)}
                onRemove={() => onRemove(user)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
