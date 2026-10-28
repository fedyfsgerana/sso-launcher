"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { ActiveBadge, GroupBadge } from "@/components/ui/status-badge";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { EmptyState } from "@/components/portal/empty-state";
import {
  BarSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";
import {
  getApplicationUsers,
  type ApplicationUser,
} from "@/features/applications/admin-api";
import { departmentLabel, initials } from "@/lib/portal/format";
import { usePagination } from "@/lib/portal/use-pagination";
import { avatarColorClass } from "@/lib/portal/palette";

type ApplicationUsersPanelProps = Readonly<{
  applicationId: string;
}>;

export function ApplicationUsersPanel({
  applicationId,
}: ApplicationUsersPanelProps) {
  const [users, setUsers] = useState<ApplicationUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");

  useEffect(() => {
    let active = true;

    void getApplicationUsers(applicationId)
      .catch(() => [] as ApplicationUser[])
      .then((list) => {
        if (active) {
          setUsers(list);
        }
      });

    return () => {
      active = false;
    };
  }, [applicationId]);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();

    for (const user of users ?? []) {
      for (const name of user.groupNames) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }

    return [...counts.entries()].sort(([left], [right]) =>
      left.localeCompare(right, "id-ID"),
    );
  }, [users]);

  const list = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return (users ?? []).filter((user) => {
      if (group && !user.groupNames.includes(group)) {
        return false;
      }

      return `${user.name} ${user.email} ${user.department ?? ""} ${user.departemenCode ?? ""} ${user.groupNames.join(" ")}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [users, query, group]);

  const pager = usePagination(list);
  const filtered = Boolean(query.trim() || group);

  return (
    <div className="pk-panel">
      {users === null ? (
        <BarSkeleton />
      ) : (
        <div className="ma-bar us-bar pk-bar">
          <label className="search us-search">
            <Icon icon={Search} size={18} />
            <input
              placeholder="Cari pengguna"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                pager.resetPage();
              }}
            />
          </label>

          <div className="seg-select">
            <TomSelect
              ariaLabel="Semua Grup"
              value={group}
              variant="filter"
              options={[
                { value: "", label: `Semua Grup (${users.length})` },
                ...groups.map(([name, count]) => ({
                  value: name,
                  label: `${name} (${count})`,
                })),
              ]}
              onChange={(value) => {
                setGroup(value);
                pager.resetPage();
              }}
            />
          </div>

          <ResetFilterButton
            onReset={() => {
              setQuery("");
              setGroup("");
              pager.resetPage();
            }}
          />
        </div>
      )}

      {users === null ? null : (
        <div className="pk-info">
          <span>
            Pengguna dengan akses <b>{users.length}</b>
          </span>
          <span>
            Lewat <b>{groups.length} grup</b>
          </span>
          <span className="pk-hint">
            Anggota grup aktif yang diberi akses ke aplikasi ini. Atur aksesnya
            di Grup &amp; Akses.
          </span>
        </div>
      )}

      {users === null ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <div className="table-wrap">
          <table className="dt ut">
            <thead>
              <tr>
                <th className="ta-c">No</th>
                <th>Nama</th>
                <th className="hs">Departemen</th>
                <th>Diberikan Lewat</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {pager.rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      badge={filtered ? SearchX : undefined}
                      title={
                        filtered
                          ? "Pengguna tidak ditemukan"
                          : "Belum ada pengguna"
                      }
                      description={
                        filtered
                          ? "Coba ubah kata kunci atau filter."
                          : "Berikan akses lewat Manajemen Grup & Akses."
                      }
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                pager.rows.map((user, index) => (
                  <tr key={user.userId}>
                    <td className="ta-c">
                      <span className="row-no">{pager.offset + index + 1}</span>
                    </td>
                    <td>
                      <div className="who">
                        <span className={`av ${avatarColorClass(user.name)}`}>
                          {initials(user.name)}
                        </span>
                        <div>
                          <b>{user.name}</b>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="hs">
                      {departmentLabel(user.department, user.departemenCode)}
                    </td>
                    <td>
                      <span className="grp-tags">
                        {user.groupNames.map((name) => (
                          <GroupBadge key={name}>{name}</GroupBadge>
                        ))}
                      </span>
                    </td>
                    <td>
                      <ActiveBadge active={user.isActive} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {users === null ? (
        <PagerSkeleton />
      ) : (
        <DataPager
          page={pager.page}
          pageSize={pager.pageSize}
          total={list.length}
          unit="pengguna"
          onPage={pager.setPage}
          onPageSize={pager.setPageSize}
        />
      )}
    </div>
  );
}
