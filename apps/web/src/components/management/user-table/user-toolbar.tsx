"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";

type FilterOption = Readonly<{
  value: string;
  label: string;
}>;

type UserToolbarProps = Readonly<{
  query: string;
  status: string;
  counts: Readonly<{ total: number; active: number; inactive: number }>;
  department: string;
  group: string;
  departments: readonly FilterOption[];
  groups: readonly FilterOption[];
  canCreate: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onDepartmentChange: (department: string) => void;
  onGroupChange: (group: string) => void;
  onReset: () => void;
}>;

export function UserToolbar({
  query,
  status,
  counts,
  department,
  group,
  departments,
  groups,
  canCreate,
  onQueryChange,
  onStatusChange,
  onDepartmentChange,
  onGroupChange,
  onReset,
}: UserToolbarProps) {
  return (
    <div className="ma-bar us-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder="Cari pengguna"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Status"
          value={status}
          variant="filter"
          options={[
            { value: "", label: `Semua Status (${counts.total})` },
            { value: "on", label: `Aktif (${counts.active})` },
            { value: "off", label: `Nonaktif (${counts.inactive})` },
          ]}
          onChange={onStatusChange}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Departemen"
          value={department}
          variant="filter"
          options={[{ value: "", label: "Semua Departemen" }, ...departments]}
          onChange={onDepartmentChange}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Grup"
          value={group}
          variant="filter"
          options={[{ value: "", label: "Semua Grup" }, ...groups]}
          onChange={onGroupChange}
        />
      </div>

      <ResetFilterButton onReset={onReset} />

      {canCreate ? (
        <Link className="btn" href="/users/new">
          Tambah Pengguna
          <Icon icon={Plus} size={18} />
        </Link>
      ) : null}
    </div>
  );
}
