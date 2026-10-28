"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";
import { STATUS_OPTIONS } from "@/lib/portal/options";

type ApplicationToolbarProps = Readonly<{
  query: string;
  status: string;
  counts: Readonly<{
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
  }>;
  category: string;
  categories: readonly string[];
  canCreate: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
}>;

export function ApplicationToolbar({
  query,
  status,
  counts,
  category,
  categories,
  canCreate,
  onQueryChange,
  onStatusChange,
  onCategoryChange,
  onReset,
}: ApplicationToolbarProps) {
  return (
    <div className="ma-bar us-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder="Cari aplikasi"
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
            ...STATUS_OPTIONS.map((item) => ({
              value: item.value,
              label: `${item.label} (${counts[item.value]})`,
            })),
          ]}
          onChange={onStatusChange}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Kategori"
          value={category}
          variant="filter"
          options={[
            { value: "", label: "Semua Kategori" },
            ...categories.map((item) => ({ value: item, label: item })),
          ]}
          onChange={onCategoryChange}
        />
      </div>

      <ResetFilterButton onReset={onReset} />

      {canCreate ? (
        <Link className="btn" href="/applications/new">
          Tambah Aplikasi
          <Icon icon={Plus} size={18} />
        </Link>
      ) : null}
    </div>
  );
}
