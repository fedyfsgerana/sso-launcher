"use client";

import { ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { HoverTip, useHoverTip } from "@/components/ui/hover-tip";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import styles from "./menu-board.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "on", label: "Aktif" },
  { value: "off", label: "Nonaktif" },
  { value: "maintenance", label: "Perbaikan" },
];

type MenuBoardToolbarProps = Readonly<{
  query: string;
  status: string;
  view: ViewMode;
  section: string;
  sectionOptions: readonly { value: string; label: string }[];
  allCollapsed: boolean;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onViewChange: (view: ViewMode) => void;
  onSectionChange: (section: string) => void;
  onToggleAll: () => void;
  onReset: () => void;
}>;

export function MenuBoardToolbar({
  query,
  status,
  view,
  section,
  sectionOptions,
  allCollapsed,
  onQueryChange,
  onStatusChange,
  onViewChange,
  onSectionChange,
  onToggleAll,
  onReset,
}: MenuBoardToolbarProps) {
  const tip = useHoverTip();
  const tableView = view === "list";
  const toggleLabel = allCollapsed ? "Buka semua" : "Ciutkan semua";

  return (
    <header className={styles.boardHead}>
      <div className={`ma-bar us-bar ${styles.toolbar}`}>
        <label className="search us-search">
          <Icon icon={Search} size={18} />
          <input
            placeholder="Cari menu di semua bagian"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>

        {tableView ? (
          <div className="seg-select">
            <TomSelect
              ariaLabel="Semua bagian"
              value={section}
              variant="filter"
              options={[
                { value: "", label: "Semua bagian" },
                ...sectionOptions,
              ]}
              onChange={onSectionChange}
            />
          </div>
        ) : null}

        <div className="seg-select">
          <TomSelect
            ariaLabel="Semua status"
            value={status}
            variant="filter"
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
          />
        </div>

        {tableView ? (
          <>
            <button
              {...tip.triggerProps}
              className="icon-btn"
              type="button"
              aria-label={toggleLabel}
              onClick={onToggleAll}
            >
              <Icon
                icon={allCollapsed ? ChevronsUpDown : ChevronsDownUp}
                size={18}
              />
            </button>
            <HoverTip
              id={tip.id}
              placement={tip.placement}
              leaving={tip.leaving}
            >
              {toggleLabel}
            </HoverTip>
          </>
        ) : null}

        <ViewToggle
          value={view}
          labels={{ grid: "Tampilan papan", list: "Tampilan tabel" }}
          onChange={onViewChange}
        />
        <ResetFilterButton onReset={onReset} />
      </div>
    </header>
  );
}
