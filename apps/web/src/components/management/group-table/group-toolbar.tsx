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

type GroupToolbarProps = Readonly<{
  query: string;
  status: string;
  counts: Readonly<{ total: number; active: number; inactive: number }>;
  department: string;
  departments: readonly FilterOption[];
  canCreate: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onDepartmentChange: (department: string) => void;
  onReset: () => void;
}>;

export function GroupToolbar({
  query,
  status,
  counts,
  department,
  departments,
  canCreate,
  onQueryChange,
  onStatusChange,
  onDepartmentChange,
  onReset,
}: GroupToolbarProps) {
  return (
    <div className="ma-bar us-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder="Cari grup"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

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

      <ResetFilterButton onReset={onReset} />

      {canCreate ? (
        <Link className="btn" href="/groups/new">
          Tambah Grup
          <Icon icon={Plus} size={18} />
        </Link>
      ) : null}
    </div>
  );
}
