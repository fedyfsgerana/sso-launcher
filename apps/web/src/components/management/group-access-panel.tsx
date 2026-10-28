"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck, SearchX } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
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
import { usePagination } from "@/lib/portal/use-pagination";
import { Icon } from "@/components/ui/icon";
import { PickCheck } from "@/components/management/pick-check";
import { PickFooter } from "@/components/management/pick-footer";
import {
  PickToolbar,
  type PickView,
} from "@/components/management/pick-toolbar";
import {
  getGroupApplicationOptions,
  setGroupAccess,
  type GroupApplicationOption,
  type UserGroupDetail,
} from "@/features/groups/api";
import { resolveIcon } from "@/lib/icons";

type GroupAccessPanelProps = Readonly<{
  detail: UserGroupDetail;
  onSaved: () => void;
}>;

function toMap(detail: UserGroupDetail) {
  return Object.fromEntries(
    detail.accesses.map((access) => [access.applicationId, true]),
  ) as Record<string, boolean>;
}

function sameMap(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
) {
  const keys = Object.keys(left);

  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => left[key] === right[key])
  );
}

export function GroupAccessPanel({ detail, onSaved }: GroupAccessPanelProps) {
  const router = useAppRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const initial = useMemo(() => toMap(detail), [detail]);
  const [applications, setApplications] = useState<
    GroupApplicationOption[] | null
  >(null);
  const [selected, setSelected] = useState<Record<string, boolean>>(initial);
  const [loadedFor, setLoadedFor] = useState(detail);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PickView>("");
  const [saving, setSaving] = useState(false);

  if (loadedFor !== detail) {
    setLoadedFor(detail);
    setSelected(initial);
  }

  useEffect(() => {
    let active = true;

    void getGroupApplicationOptions()
      .then((list) => {
        if (active) {
          setApplications(list);
        }
      })
      .catch(() => {
        if (active) {
          setApplications([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return (applications ?? []).filter((application) => {
      const on = Boolean(selected[application.id]);

      if (view === "selected" && !on) {
        return false;
      }

      if (view === "unselected" && on) {
        return false;
      }

      return `${application.name} ${application.category} ${application.slug}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [applications, query, view, selected]);

  const pager = usePagination(visible);
  const visibleIds = pager.rows.map((application) => application.id);
  const allChecked =
    visibleIds.length > 0 && visibleIds.every((id) => selected[id]);
  const someChecked = visibleIds.some((id) => selected[id]);
  const dirty = !sameMap(selected, initial);
  const chosen = Object.keys(selected);
  const added = chosen.filter((id) => !initial[id]);
  const removed = Object.keys(initial).filter((id) => !selected[id]);
  const total = applications?.length ?? 0;

  function names(ids: string[]) {
    return ids
      .map(
        (id) =>
          applications?.find((application) => application.id === id)?.name ??
          "aplikasi lain",
      )
      .join(", ");
  }

  function toggle(applicationId: string, checked: boolean) {
    setSelected((value) => {
      const next = { ...value };

      if (checked) {
        next[applicationId] = true;
      } else {
        delete next[applicationId];
      }

      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected((value) => {
      const next = { ...value };

      for (const id of visibleIds) {
        if (checked) {
          next[id] = true;
        } else {
          delete next[id];
        }
      }

      return next;
    });
  }

  async function save() {
    const changes = [
      added.length > 0 ? `Ditambahkan (${added.length}): ${names(added)}.` : "",
      removed.length > 0
        ? `Dicabut (${removed.length}): ${names(removed)}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const approved = await confirm({
      title: `Simpan akses aplikasi grup ${detail.name}?`,
      message: `Grup akan memiliki akses ke ${chosen.length} aplikasi. ${changes} Anggota grup langsung mendapat atau kehilangan akses sesuai pilihan ini.`,
      confirmLabel: "Ya, Simpan",
      icon: CircleCheck,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await setGroupAccess(detail.id, Object.keys(selected));
      queueToast(`Akses aplikasi grup ${detail.name} disimpan`);
      router.push("/groups");
      onSaved();
    } catch {
      showToast("Akses aplikasi gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pk-panel">
      {applications === null ? (
        <BarSkeleton />
      ) : (
        <PickToolbar
          query={query}
          placeholder="Cari aplikasi"
          view={view}
          counts={{
            all: total,
            selected: chosen.length,
            unselected: Math.max(0, total - chosen.length),
          }}
          onQuery={(value) => {
            setQuery(value);
            pager.resetPage();
          }}
          onView={(value) => {
            setView(value);
            pager.resetPage();
          }}
        />
      )}

      {applications === null ? null : (
        <div className="pk-info">
          <span>
            Akses tersimpan <b>{Object.keys(initial).length} aplikasi</b>
          </span>
          <span className="pk-hint">
            Aplikasi yang dicentang muncul di Aplikasi Saya untuk semua anggota
            grup ini.
          </span>
        </div>
      )}

      {applications === null ? (
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
                <th>Aplikasi</th>
                <th className="hs">Kategori</th>
                <th className="hs">Status</th>
              </tr>
            </thead>

            <tbody>
              {pager.rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      badge={query || view ? SearchX : undefined}
                      title={
                        query || view
                          ? "Aplikasi tidak ditemukan"
                          : "Belum ada aplikasi"
                      }
                      description={
                        query || view
                          ? "Coba ubah kata kunci atau filter."
                          : "Tambahkan aplikasi lewat Manajemen Aplikasi."
                      }
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                pager.rows.map((application, index) => {
                  const on = Boolean(selected[application.id]);

                  return (
                    <tr key={application.id} className={on ? "sel" : undefined}>
                      <td className="ck">
                        <PickCheck
                          checked={on}
                          label={`Beri akses ${application.name}`}
                          onChange={(checked) =>
                            toggle(application.id, checked)
                          }
                        />
                      </td>
                      <td className="ta-c">
                        <span className="row-no">
                          {pager.offset + index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="who">
                          <span className={`rc-ic ${application.color}`}>
                            <Icon icon={resolveIcon(application.icon)} />
                          </span>
                          <div>
                            <b>{application.name}</b>
                            <small>{application.slug}</small>
                          </div>
                        </div>
                      </td>
                      <td className="hs">{application.category || "-"}</td>
                      <td className="hs">
                        <ApplicationStatusBadge status={application.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {applications === null ? (
        <PagerSkeleton />
      ) : (
        <DataPager
          page={pager.page}
          pageSize={pager.pageSize}
          total={visible.length}
          unit="aplikasi"
          onPage={pager.setPage}
          onPageSize={pager.setPageSize}
        />
      )}

      {applications === null ? (
        <PagerSkeleton />
      ) : (
        <PickFooter
          selected={chosen.length}
          total={total}
          unit="aplikasi"
          dirty={dirty}
          saving={saving}
          added={added.length}
          removed={removed.length}
          removedLabel="dicabut"
          cancelHref="/groups"
          onSave={() => void save()}
        />
      )}
    </div>
  );
}
