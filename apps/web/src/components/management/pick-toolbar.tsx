"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";

export type PickView = "" | "selected" | "unselected";

type PickToolbarProps = Readonly<{
  query: string;
  placeholder: string;
  view: PickView;
  counts?: Readonly<{ all: number; selected: number; unselected: number }>;
  extra?: ReactNode;
  onQuery: (value: string) => void;
  onView: (value: PickView) => void;
}>;

export function PickToolbar({
  query,
  placeholder,
  view,
  counts,
  extra,
  onQuery,
  onView,
}: PickToolbarProps) {
  return (
    <div className="ma-bar us-bar pk-bar">
      <label className="search us-search">
        <Icon icon={Search} size={18} />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </label>

      <div className="seg-select">
        <TomSelect
          ariaLabel="Semua Pilihan"
          value={view}
          variant="filter"
          options={[
            {
              value: "",
              label: counts ? `Semua Pilihan (${counts.all})` : "Semua Pilihan",
            },
            {
              value: "selected",
              label: counts ? `Dipilih (${counts.selected})` : "Dipilih",
            },
            {
              value: "unselected",
              label: counts
                ? `Belum Dipilih (${counts.unselected})`
                : "Belum Dipilih",
            },
          ]}
          onChange={(value) => onView(value as PickView)}
        />
      </div>

      {extra}

      <ResetFilterButton
        onReset={() => {
          onQuery("");
          onView("");
        }}
      />
    </div>
  );
}
