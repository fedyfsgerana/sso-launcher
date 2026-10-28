import { PickCheck } from "@/components/management/pick-check";
import { SortButton } from "@/components/ui/sort-header";
import type { SortState } from "@/lib/portal/use-server-table";

type RecentHeadProps = Readonly<{
  allChecked: boolean;
  someChecked: boolean;
  sort: SortState;
  onSelectAll: (checked: boolean) => void;
  onSort: (key: string) => void;
}>;

export function RecentHead({
  allChecked,
  someChecked,
  sort,
  onSelectAll,
  onSort,
}: RecentHeadProps) {
  return (
    <div className="rc-row rc-head selectable">
      <div className="rc-ck">
        <PickCheck
          checked={allChecked}
          indeterminate={someChecked}
          label="Pilih semua di halaman ini"
          onChange={onSelectAll}
        />
      </div>
      <div className="rc-no">No</div>
      <div>
        <SortButton label="Nama" sortKey="name" sort={sort} onSort={onSort} />
      </div>
      <div className="rc-time">
        <SortButton
          label="Diakses Pada"
          sortKey="time"
          sort={sort}
          onSort={onSort}
        />
      </div>
      <div className="rc-act">Aksi</div>
    </div>
  );
}
