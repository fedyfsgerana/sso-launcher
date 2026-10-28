"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, SearchX } from "lucide-react";
import { ActiveBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/portal/empty-state";
import {
  BarSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from "@/components/portal/skeleton";
import { DataPager } from "@/components/ui/data-pager";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useToast } from "@/components/portal/toast";
import { queueToast } from "@/lib/portal/pending-toast";
import { useServerTable } from "@/lib/portal/use-server-table";
import { SortHeader } from "@/components/ui/sort-header";
import type { TableQuery } from "@/lib/api/paged";
import { PickCheck } from "@/components/management/pick-check";
import { PickFooter } from "@/components/management/pick-footer";
import {
  PickToolbar,
  type PickView,
} from "@/components/management/pick-toolbar";
import {
  getGroupUserOptionsPage,
  setGroupMembers,
  type UserGroupDetail,
} from "@/features/groups/api";
import type { PortalUser } from "@/features/users/api";
import { departmentLabel, initials } from "@/lib/portal/format";
import { avatarColorClass } from "@/lib/portal/palette";

type GroupMembersPanelProps = Readonly<{
  detail: UserGroupDetail;
  onSaved: () => void;
}>;

type KnownUser = Readonly<{ name: string; jobTitle: string | null }>;

function describe(ids: string[], known: Record<string, KnownUser>) {
  const names = ids.map((id) => known[id]?.name).filter(Boolean);
  const unknown = ids.length - names.length;

  return [...names, unknown > 0 ? `${unknown} pengguna lain` : ""]
    .filter(Boolean)
    .join(", ");
}

function sameSet(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((item) => right.includes(item))
  );
}

export function GroupMembersPanel({ detail, onSaved }: GroupMembersPanelProps) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const initial = useMemo(
    () => detail.members.map((member) => member.userId),
    [detail],
  );
  const [selected, setSelected] = useState<string[]>(initial);
  const [known, setKnown] = useState<Record<string, KnownUser>>(() =>
    Object.fromEntries(
      detail.members.map((member) => [
        member.userId,
        { name: member.name, jobTitle: member.jobTitle },
      ]),
    ),
  );
  const [loadedFor, setLoadedFor] = useState(detail);
  const [view, setView] = useState<PickView>("");
  const [saving, setSaving] = useState(false);
  const [departmentTotal, setDepartmentTotal] = useState(0);
  const fetchPage = useCallback(
    (query: TableQuery) => getGroupUserOptionsPage(detail.id, query),
    [detail.id],
  );
  const table = useServerTable<PortalUser>({
    fetchPage,
    filters: {
      view:
        view === "selected" ? "members" : view === "unselected" ? "others" : "",
    },
  });
  const query = table.search;
  const loading = table.loading;
  const pager = {
    rows: table.items,
    offset: table.offset,
  };

  if (loadedFor !== detail) {
    setLoadedFor(detail);
    setSelected(initial);
  }

  useEffect(() => {
    let active = true;

    void getGroupUserOptionsPage(detail.id, { page: 1, pageSize: 1 })
      .then((result) => {
        if (active) {
          setDepartmentTotal(result.total);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [detail.id]);

  const visibleIds = pager.rows.map((user) => user.id);
  const groupDepartment = departmentLabel(
    detail.department,
    detail.departemenCode,
  );
  const allChecked =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someChecked = visibleIds.some((id) => selected.includes(id));
  const dirty = !sameSet(selected, initial);
  const added = selected.filter((id) => !initial.includes(id));
  const removed = initial.filter((id) => !selected.includes(id));

  function remember(users: PortalUser[]) {
    setKnown((value) => ({
      ...value,
      ...Object.fromEntries(
        users.map((user) => [
          user.id,
          { name: user.name, jobTitle: user.jobTitle },
        ]),
      ),
    }));
  }

  function toggle(userId: string, checked: boolean) {
    setSelected((value) =>
      checked
        ? [...new Set([...value, userId])]
        : value.filter((item) => item !== userId),
    );
  }

  function toggleAll(checked: boolean) {
    remember(pager.rows);

    setSelected((value) =>
      checked
        ? [...new Set([...value, ...visibleIds])]
        : value.filter((id) => !visibleIds.includes(id)),
    );
  }

  async function save() {
    const members = selected;
    const changes = [
      added.length > 0
        ? `Ditambahkan (${added.length}): ${describe(added, known)}.`
        : "",
      removed.length > 0
        ? `Dikeluarkan (${removed.length}): ${describe(removed, known)}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const approved = await confirm({
      title: `Simpan pengguna grup ${detail.name}?`,
      message: `Grup akan berisi ${members.length} pengguna. ${changes} Pengguna yang dikeluarkan langsung kehilangan akses dari grup ini.`,
      confirmLabel: "Ya, Simpan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await setGroupMembers(detail.id, members);
      onSaved();
      queueToast(`Pengguna grup ${detail.name} disimpan`);
      router.push("/groups");
    } catch {
      showToast("Pengguna grup gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pk-panel">
      {loading ? (
        <BarSkeleton />
      ) : (
        <PickToolbar
          query={query}
          placeholder="Cari pengguna"
          view={view}
          counts={{
            all: departmentTotal,
            selected: initial.length,
            unselected: Math.max(0, departmentTotal - initial.length),
          }}
          onQuery={table.setSearch}
          onView={(value) => {
            setView(value);
            table.resetPage();
          }}
        />
      )}

      <div className="pk-info">
        {detail.department ? (
          <span>
            Departemen <b>{groupDepartment}</b>
          </span>
        ) : null}
        <span>
          Anggota tersimpan <b>{initial.length}</b>
        </span>
        <span className="pk-hint">
          Filter Dipilih dan Belum Dipilih mengikuti anggota yang sudah
          tersimpan.
        </span>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <div className="table-wrap">
          <table className="dt ut">
            <thead>
              <tr>
                <th className="ck">
                  <PickCheck
                    checked={allChecked}
                    indeterminate={someChecked}
                    label="Pilih semua di halaman ini"
                    onChange={toggleAll}
                  />
                </th>
                <th className="ta-c">No</th>
                <SortHeader
                  label="Nama"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortHeader
                  className="hs"
                  label="Email"
                  sortKey="email"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th className="hs">Jabatan</th>
                <SortHeader
                  label="Status"
                  sortKey="status"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
              </tr>
            </thead>

            <tbody>
              {pager.rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      badge={query || view ? SearchX : undefined}
                      title={
                        query || view
                          ? "Pengguna tidak ditemukan"
                          : detail.department
                            ? `Belum ada pengguna departemen ${groupDepartment}`
                            : "Belum ada pengguna"
                      }
                      description={
                        query || view
                          ? "Coba ubah kata kunci atau filter."
                          : "Tambahkan pengguna departemen ini lewat Manajemen Pengguna."
                      }
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                pager.rows.map((user, index) => {
                  const on = selected.includes(user.id);

                  return (
                    <tr key={user.id} className={on ? "sel" : undefined}>
                      <td className="ck">
                        <PickCheck
                          checked={on}
                          label={`Pilih ${user.name}`}
                          onChange={(checked) => {
                            remember([user]);
                            toggle(user.id, checked);
                          }}
                        />
                      </td>
                      <td className="ta-c">
                        <span className="row-no">
                          {pager.offset + index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="who">
                          <span className={`av ${avatarColorClass(user.name)}`}>
                            {initials(user.name)}
                          </span>
                          <div>
                            <b>{user.name}</b>
                            <small>{user.employeeNumber ?? "-"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="muted hs">{user.email}</td>
                      <td className="hs">{user.jobTitle ?? "-"}</td>
                      <td>
                        <ActiveBadge active={user.isActive} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading ? (
        <PagerSkeleton />
      ) : (
        <DataPager
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          unit="pengguna"
          onPage={table.setPage}
          onPageSize={table.setPageSize}
        />
      )}

      {loading ? (
        <PagerSkeleton />
      ) : (
        <PickFooter
          selected={selected.length}
          total={departmentTotal}
          unit="pengguna"
          dirty={dirty}
          saving={saving}
          added={added.length}
          removed={removed.length}
          cancelHref="/groups"
          onSave={() => void save()}
        />
      )}
    </div>
  );
}
