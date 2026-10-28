"use client";

import { Download, Search } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { TomSelect } from "@/components/ui/tom-select";
import type { AuditActor } from "@/features/audit/api";
import type { AuditFilterState } from "@/features/audit/audit-filters";
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  AUDIT_OUTCOMES,
} from "@/lib/portal/audit-options";
import styles from "./audit-toolbar.module.css";

type AuditToolbarProps = Readonly<{
  query: string;
  filters: AuditFilterState;
  actors: readonly AuditActor[];
  canExport: boolean;
  exporting: boolean;
  onQueryChange: (query: string) => void;
  onFilterChange: (key: keyof AuditFilterState, value: string) => void;
  onReset: () => void;
  onExport: () => void;
}>;

type FilterOption = Readonly<{
  value: string;
  label: string;
}>;

function withAll(label: string, options: readonly FilterOption[]) {
  return [{ value: "", label }, ...options.map((item) => ({ ...item }))];
}

export function AuditToolbar({
  query,
  filters,
  actors,
  canExport,
  exporting,
  onQueryChange,
  onFilterChange,
  onReset,
  onExport,
}: AuditToolbarProps) {
  return (
    <div className="ma-bar us-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder="Cari aktivitas"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Aksi"
          value={filters.action}
          variant="filter"
          options={withAll("Semua Aksi", AUDIT_ACTIONS)}
          onChange={(value) => onFilterChange("action", value)}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Modul"
          value={filters.module}
          variant="filter"
          options={withAll("Semua Modul", AUDIT_MODULES)}
          onChange={(value) => onFilterChange("module", value)}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Hasil"
          value={filters.outcome}
          variant="filter"
          options={withAll("Semua Hasil", AUDIT_OUTCOMES)}
          onChange={(value) => onFilterChange("outcome", value)}
        />
      </div>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Pengguna"
          value={filters.actorId}
          variant="filter"
          options={withAll(
            "Semua Pengguna",
            actors.map((actor) => ({
              value: actor.actorId,
              label: actor.name,
            })),
          )}
          onChange={(value) => onFilterChange("actorId", value)}
        />
      </div>

      <div className={styles.dateRange}>
        <input
          type="date"
          aria-label="Dari tanggal"
          value={filters.fromDate}
          max={filters.toDate || undefined}
          onChange={(event) => onFilterChange("fromDate", event.target.value)}
        />
        <span>s.d.</span>
        <input
          type="date"
          aria-label="Sampai tanggal"
          value={filters.toDate}
          min={filters.fromDate || undefined}
          onChange={(event) => onFilterChange("toDate", event.target.value)}
        />
      </div>

      <ResetFilterButton onReset={onReset} />

      {canExport ? (
        <button
          className={
            exporting ? "btn tone-success is-loading" : "btn tone-success"
          }
          type="button"
          disabled={exporting}
          onClick={onExport}
        >
          {exporting ? "Mengekspor" : "Ekspor Excel"}
          {exporting ? (
            <Spinner size={16} />
          ) : (
            <Icon icon={Download} size={18} />
          )}
        </button>
      ) : null}
    </div>
  );
}
