import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import type { SortState } from "@/lib/portal/use-server-table";

type SortButtonProps = Readonly<{
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
}>;

type SortHeaderProps = SortButtonProps &
  Readonly<{
    className?: string;
  }>;

function activeDirection(sort: SortState, sortKey: string) {
  return sort?.key === sortKey ? sort.direction : null;
}

export function SortButton({ label, sortKey, sort, onSort }: SortButtonProps) {
  const active = activeDirection(sort, sortKey);

  return (
    <button
      className={active ? "sort-th is-active" : "sort-th"}
      type="button"
      title={
        active === "asc"
          ? `Urutkan ${label} dari besar ke kecil`
          : active === "desc"
            ? "Kembalikan urutan bawaan"
            : `Urutkan ${label} dari kecil ke besar`
      }
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon
        icon={
          active === "asc"
            ? ArrowUp
            : active === "desc"
              ? ArrowDown
              : ChevronsUpDown
        }
        size={13}
      />
    </button>
  );
}

export function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortHeaderProps) {
  const active = activeDirection(sort, sortKey);

  return (
    <th
      className={className}
      aria-sort={
        active === "asc"
          ? "ascending"
          : active === "desc"
            ? "descending"
            : "none"
      }
    >
      <SortButton label={label} sortKey={sortKey} sort={sort} onSort={onSort} />
    </th>
  );
}
