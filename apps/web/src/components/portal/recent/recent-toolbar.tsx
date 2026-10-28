"use client";

import { Search, Trash2 } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";
import type {
  RecentFilter,
  RecentPeriod,
} from "@/features/activities/recent-filter";

type FilterOption = Readonly<{
  value: string;
  label: string;
}>;

type RecentToolbarProps = Readonly<{
  filter: RecentFilter;
  categories: readonly FilterOption[];
  canClear: boolean;
  onChange: (update: Partial<RecentFilter>) => void;
  onReset: () => void;
  onClear: () => void;
}>;

const FAVORITE_OPTIONS = [
  { value: "", label: "Semua Aplikasi" },
  { value: "yes", label: "Favorit" },
  { value: "no", label: "Bukan Favorit" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "Semua Waktu" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "7 Hari Terakhir" },
];

export function RecentToolbar({
  filter,
  categories,
  canClear,
  onChange,
  onReset,
  onClear,
}: RecentToolbarProps) {
  return (
    <div className="ma-bar us-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder="Cari aktivitas"
          value={filter.query}
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </label>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Kategori"
          value={filter.category}
          variant="filter"
          options={[{ value: "", label: "Semua Kategori" }, ...categories]}
          onChange={(category) => onChange({ category })}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Aplikasi"
          value={filter.favorite}
          variant="filter"
          options={FAVORITE_OPTIONS}
          onChange={(favorite) => onChange({ favorite })}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Waktu"
          value={filter.period}
          variant="filter"
          options={PERIOD_OPTIONS}
          onChange={(period) => onChange({ period: period as RecentPeriod })}
        />
      </div>

      <ResetFilterButton onReset={onReset} />

      <button
        className="btn tone-danger"
        type="button"
        disabled={!canClear}
        title={canClear ? undefined : "Belum ada riwayat untuk dibersihkan"}
        onClick={onClear}
      >
        Bersihkan Riwayat
        <Icon icon={Trash2} size={18} />
      </button>
    </div>
  );
}
