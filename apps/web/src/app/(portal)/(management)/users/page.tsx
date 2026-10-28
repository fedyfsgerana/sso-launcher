"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ActiveBulkBar } from "@/components/management/active-bulk-bar";
import { UserTable } from "@/components/management/user-table/user-table";
import { UserToolbar } from "@/components/management/user-table/user-toolbar";
import { PageHero } from "@/components/portal/page-hero";
import { Icon } from "@/components/ui/icon";
import {
  BarSkeleton,
  HeroSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import { getGroups } from "@/features/groups/api";
import { useDepartments } from "@/features/departments/use-departments";
import { getOverviewInsights } from "@/features/overview/api";
import {
  getUserSummary,
  getUsersPage,
  type PortalUser,
  type UserSummary,
} from "@/features/users/api";
import { useUserActions } from "@/features/users/use-user-actions";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { useRowSelection } from "@/lib/portal/use-row-selection";
import { useServerTable } from "@/lib/portal/use-server-table";

type FilterOption = { value: string; label: string };

const EMPTY_SUMMARY: UserSummary = { total: 0, active: 0, inactive: 0 };

function statusFilter(status: string) {
  if (status === "on") {
    return "active";
  }

  return status === "off" ? "inactive" : "";
}

export default function UsersPage() {
  const { can } = useMenuActions("users");
  const { departments } = useDepartments();
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [groupOptions, setGroupOptions] = useState<FilterOption[]>([]);
  const [summary, setSummary] = useState<UserSummary>(EMPTY_SUMMARY);
  const [locked, setLocked] = useState(0);
  const table = useServerTable<PortalUser>({
    fetchPage: getUsersPage,
    filters: {
      status: statusFilter(status),
      department,
      groupId: groupFilter,
    },
  });
  const showSkeleton = useMinLoading(table.loading);
  const users = table.items;
  const selection = useRowSelection(users.map((user) => user.id));

  function loadSummary() {
    void getUserSummary()
      .then(setSummary)
      .catch(() => undefined);
    void getOverviewInsights()
      .then((value) => setLocked(value.lockedAccounts ?? 0))
      .catch(() => undefined);
  }

  useEffect(() => {
    let active = true;

    void getUserSummary()
      .then((value) => {
        if (active) {
          setSummary(value);
        }
      })
      .catch(() => undefined);

    void getOverviewInsights()
      .then((value) => {
        if (active) {
          setLocked(value.lockedAccounts ?? 0);
        }
      })
      .catch(() => undefined);

    void getGroups()
      .then((groups) => {
        if (active) {
          setGroupOptions(
            groups
              .map((group) => ({ value: group.id, label: group.name }))
              .sort((left, right) =>
                left.label.localeCompare(right.label, "id-ID"),
              ),
          );
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

  const actions = useUserActions({
    onChanged: reload,
    onBulkDone: selection.clear,
    onRemoved: (userId) => selection.toggleOne(userId, false),
  });

  function resetFilters() {
    table.setSearch("");
    setStatus("");
    setDepartment("");
    setGroupFilter("");
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
          title="Manajemen Pengguna"
          description="Kelola pengguna yang bisa masuk ke SSO Launcher."
          actions={
            can("create") ? (
              <Link className="btn" href="/users/new">
                Tambah Pengguna
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
          <UserToolbar
            query={table.search}
            status={status}
            counts={summary}
            department={department}
            group={groupFilter}
            departments={departments.map((item) => ({
              value: item.name,
              label: item.name,
            }))}
            groups={groupOptions}
            canCreate={false}
            onQueryChange={table.setSearch}
            onStatusChange={changeFilter(setStatus)}
            onDepartmentChange={changeFilter(setDepartment)}
            onGroupChange={changeFilter(setGroupFilter)}
            onReset={resetFilters}
          />
        )}

        {!showSkeleton && locked > 0 ? (
          <div className="pk-info warn" role="status">
            <span>
              Akun terkunci <b>{locked}</b>
            </span>
            <span className="pk-hint">
              Terlalu sering salah password. Buka kuncinya lewat ⋯ → Keamanan
              pada pengguna tersebut.
            </span>
          </div>
        ) : null}

        {selection.selected.length > 0 ? (
          <ActiveBulkBar
            count={selection.selected.length}
            noun="pengguna"
            canUpdate={can("update")}
            canDelete={can("delete")}
            onAction={(action) =>
              void actions.bulk(
                users.filter((user) => selection.isSelected(user.id)),
                action,
              )
            }
          />
        ) : null}

        {showSkeleton ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <UserTable
            rows={users}
            offset={table.offset}
            sort={table.sort}
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            can={can}
            isSelected={selection.isSelected}
            onSort={table.toggleSort}
            onSelectAll={selection.toggleAll}
            onSelect={selection.toggleOne}
            onToggleActive={(user) => void actions.toggleActive(user)}
            onRemove={(user) => void actions.remove(user)}
          />
        )}

        {showSkeleton ? (
          <PagerSkeleton />
        ) : (
          <DataPager
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            unit="pengguna"
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
    </div>
  );
}
