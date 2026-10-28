"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ActiveBulkBar } from "@/components/management/active-bulk-bar";
import { DuplicateGroupModal } from "@/components/management/duplicate-group-modal";
import { GroupTable } from "@/components/management/group-table/group-table";
import { GroupToolbar } from "@/components/management/group-table/group-toolbar";
import { PageHero } from "@/components/portal/page-hero";
import { Icon } from "@/components/ui/icon";
import {
  BarSkeleton,
  HeroSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import {
  getGroupsPage,
  getGroupsSummary,
  type GroupSummary,
  type UserGroup,
} from "@/features/groups/api";
import { useGroupActions } from "@/features/groups/use-group-actions";
import { useDepartments } from "@/features/departments/use-departments";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { useRowSelection } from "@/lib/portal/use-row-selection";
import { useServerTable } from "@/lib/portal/use-server-table";

const EMPTY_SUMMARY: GroupSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  withoutMembers: 0,
};

function statusFilter(status: string) {
  if (status === "on") {
    return "active";
  }

  return status === "off" ? "inactive" : "";
}

export default function GroupsPage() {
  const { can } = useMenuActions("groups");
  const { departments } = useDepartments();
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [duplicating, setDuplicating] = useState<UserGroup | null>(null);
  const [summary, setSummary] = useState<GroupSummary>(EMPTY_SUMMARY);
  const table = useServerTable<UserGroup>({
    fetchPage: getGroupsPage,
    filters: { status: statusFilter(status), department },
  });
  const showSkeleton = useMinLoading(table.loading);
  const groups = table.items;
  const filtered = Boolean(table.search.trim() || status || department);
  const selection = useRowSelection(groups.map((group) => group.id));

  function loadSummary() {
    void getGroupsSummary()
      .then(setSummary)
      .catch(() => undefined);
  }

  useEffect(() => {
    let active = true;

    void getGroupsSummary()
      .then((value) => {
        if (active) {
          setSummary(value);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  function reload() {
    table.reload();
    loadSummary();
  }

  const actions = useGroupActions({
    onChanged: reload,
    onBulkDone: selection.clear,
  });

  function resetFilters() {
    table.setSearch("");
    setStatus("");
    setDepartment("");
  }

  function changeFilter(update: (value: string) => void) {
    return (value: string) => {
      update(value);
      table.resetPage();
    };
  }

  return (
    <div className="page">
      {showSkeleton ? (
        <HeroSkeleton />
      ) : (
        <PageHero
          title="Manajemen Grup & Akses"
          description="Kelompokkan pengguna, lalu atur akses mereka."
          actions={
            can("create") ? (
              <Link className="btn" href="/groups/new">
                Tambah Grup
                <Icon icon={Plus} size={18} />
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="card ma-panel">
        {showSkeleton ? (
          <BarSkeleton />
        ) : (
          <GroupToolbar
            query={table.search}
            status={status}
            counts={summary}
            department={department}
            departments={departments.map((item) => ({
              value: item.name,
              label: item.name,
            }))}
            canCreate={false}
            onQueryChange={table.setSearch}
            onStatusChange={changeFilter(setStatus)}
            onDepartmentChange={changeFilter(setDepartment)}
            onReset={resetFilters}
          />
        )}

        {selection.selected.length > 0 ? (
          <ActiveBulkBar
            count={selection.selected.length}
            noun="grup"
            canUpdate={can("update")}
            canDelete={can("delete")}
            onAction={(action) =>
              void actions.bulk(
                groups.filter((group) => selection.isSelected(group.id)),
                action,
              )
            }
          />
        ) : null}

        {showSkeleton ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <GroupTable
            rows={groups}
            offset={table.offset}
            filtered={filtered}
            sort={table.sort}
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            can={can}
            isSelected={selection.isSelected}
            onSort={table.toggleSort}
            onSelectAll={selection.toggleAll}
            onSelect={selection.toggleOne}
            onDuplicate={setDuplicating}
            onToggleActive={(group) => void actions.toggleActive(group)}
            onRemove={(group) => void actions.remove(group)}
          />
        )}

        {showSkeleton ? (
          <PagerSkeleton />
        ) : (
          <DataPager
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            unit="grup"
            onPage={(next) => {
              selection.clear();
              table.setPage(next);
            }}
            onPageSize={(size) => {
              selection.clear();
              table.setPageSize(size);
            }}
          />
        )}
      </div>

      <DuplicateGroupModal
        group={duplicating}
        onClose={() => setDuplicating(null)}
        onDone={() => {
          setDuplicating(null);
          reload();
        }}
      />
    </div>
  );
}
