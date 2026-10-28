"use client";

import { useEffect, useMemo, useState } from "react";
import { History, RotateCcw, Search, SearchX, UsersRound } from "lucide-react";
import type { VersionTarget } from "@/components/management/audit-detail-modal";
import { useConfirm } from "@/components/portal/confirm-provider";
import { EmptyState } from "@/components/portal/empty-state";
import { TableSkeleton } from "@/components/portal/skeleton";
import { useToast } from "@/components/portal/toast";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { DataPager } from "@/components/ui/data-pager";
import { Icon } from "@/components/ui/icon";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { SortHeader } from "@/components/ui/sort-header";
import { useClientSort } from "@/lib/portal/use-client-sort";
import { Spinner } from "@/components/ui/spinner";
import { TomSelect } from "@/components/ui/tom-select";
import {
  RECYCLE_TYPES,
  getDeletedRecords,
  recycleTypeLabel,
  restoreRecord,
  type DeletedItem,
  type RecycleType,
} from "@/features/recycle-bin/api";
import { ApiError } from "@/lib/api/client";
import { resolveIcon } from "@/lib/icons";
import { targetColorClass, targetIcon } from "@/lib/portal/audit-options";
import { formatRelative, initials } from "@/lib/portal/format";
import { avatarColorClass } from "@/lib/portal/palette";
import { useMinLoading } from "@/lib/portal/use-min-loading";

type RecycleBinPanelProps = Readonly<{
  reloadToken: number;
  onShowHistory: (target: VersionTarget) => void;
  onRestored: () => void;
}>;

type LoadedItems = {
  key: string;
  items: DeletedItem[];
};

function RecycleIcon({
  type,
  item,
}: Readonly<{ type: RecycleType; item: DeletedItem }>) {
  const { name, icon, color } = item;

  if (type === "user") {
    return (
      <span className={`av ${avatarColorClass(name)}`}>{initials(name)}</span>
    );
  }

  if (type === "user_group") {
    return (
      <span className={`rc-ic sm ${avatarColorClass(name)}`}>
        <Icon icon={UsersRound} />
      </span>
    );
  }

  if (type === "application" && icon && color) {
    return (
      <span className={`rc-ic sm ${color}`}>
        <Icon icon={resolveIcon(icon)} />
      </span>
    );
  }

  return (
    <span className={`rc-ic sm ${targetColorClass(type)}`}>
      <Icon icon={icon ? resolveIcon(icon) : targetIcon(type)} />
    </span>
  );
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function restoreErrorMessage(error: unknown, name: string) {
  if (error instanceof ApiError && error.status === 409) {
    return `${name} tidak bisa dipulihkan karena bentrok dengan data aktif, atau data induknya sudah dihapus.`;
  }

  if (error instanceof ApiError && error.status === 403) {
    return "Anda tidak punya akses untuk memulihkan data.";
  }

  return `${name} gagal dipulihkan. Coba lagi.`;
}

const TRASH_SORTERS: Readonly<
  Record<string, (item: DeletedItem) => string | number | null | undefined>
> = {
  name: (item) => item.name,
  deletedBy: (item) => item.deletedByName,
  deletedAt: (item) => new Date(item.deletedAt).getTime(),
};

export function RecycleBinPanel({
  reloadToken,
  onShowHistory,
  onRestored,
}: RecycleBinPanelProps) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { can } = useMenuActions("audit");
  const [type, setType] = useState<RecycleType>("user");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState<LoadedItems | null>(null);
  const [localToken, setLocalToken] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const key = `${type}:${reloadToken}:${localToken}`;
  const loading = loaded?.key !== key;
  const showSkeleton = useMinLoading(loading);

  useEffect(() => {
    let active = true;

    void getDeletedRecords(type)
      .catch(() => [] as DeletedItem[])
      .then((items) => {
        if (active) {
          setLoaded({ key, items });
        }
      });

    return () => {
      active = false;
    };
  }, [key, type]);

  const filtered = useMemo(() => {
    const items = loaded?.items ?? [];
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((item) =>
      [item.name, item.detail, item.deletedByName, item.deleteReason]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [loaded, query]);

  const { sorted, sort, toggleSort } = useClientSort(filtered, TRASH_SORTERS);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const offset = (current - 1) * pageSize;
  const rows = sorted.slice(offset, offset + pageSize);
  const typeLabel = recycleTypeLabel(type).toLowerCase();

  async function restore(item: DeletedItem) {
    if (busy) {
      return;
    }

    const approved = await confirm({
      title: `Pulihkan ${typeLabel}?`,
      message: `${item.name} akan dipulihkan dan tercatat di riwayat aktivitas. Pengguna dan aplikasi dipulihkan dalam keadaan nonaktif.`,
      confirmLabel: "Ya, Pulihkan",
      icon: RotateCcw,
    });

    if (!approved) {
      return;
    }

    setBusy(item.id);

    try {
      await restoreRecord(type, item.id);
      showToast(`${item.name} dipulihkan`);
      setLocalToken((value) => value + 1);
      onRestored();
    } catch (error) {
      showToast(restoreErrorMessage(error, item.name));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ma-panel">
      <div className="ma-bar us-bar">
        <label className="search us-search">
          <Icon icon={Search} size={18} />
          <input
            placeholder="Cari data terhapus"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <div className="seg-select">
          <TomSelect
            ariaLabel="Jenis data"
            value={type}
            variant="filter"
            options={RECYCLE_TYPES.map((item) => ({ ...item }))}
            onChange={(value) => {
              setType(value as RecycleType);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="pk-info">
        <span>
          {recycleTypeLabel(type)} terhapus{" "}
          <b>{loading ? "…" : (loaded?.items.length ?? 0)}</b>
        </span>
        <span className="pk-hint">
          Bisa dikembalikan lewat Pulihkan. Perubahan sebelum dihapus tetap bisa
          dilihat lewat Histori.
        </span>
      </div>

      {showSkeleton ? (
        <TableSkeleton rows={Math.min(pageSize, 10)} columns={6} />
      ) : (
        <div className="table-wrap">
          <table className="dt ut">
            <thead>
              <tr>
                <th className="ta-c">No</th>
                <SortHeader
                  label="Data"
                  sortKey="name"
                  sort={sort}
                  onSort={(key) => {
                    toggleSort(key);
                    setPage(1);
                  }}
                />
                <SortHeader
                  className="hs"
                  label="Dihapus Oleh"
                  sortKey="deletedBy"
                  sort={sort}
                  onSort={(key) => {
                    toggleSort(key);
                    setPage(1);
                  }}
                />
                <th className="hs">Alasan</th>
                <SortHeader
                  label="Waktu"
                  sortKey="deletedAt"
                  sort={sort}
                  onSort={(key) => {
                    toggleSort(key);
                    setPage(1);
                  }}
                />
                <th className="ta-r">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      badge={query ? SearchX : undefined}
                      title={
                        query ? "Data tidak ditemukan" : "Tempat sampah kosong"
                      }
                      description={
                        query
                          ? "Coba kata kunci lain."
                          : `Belum ada ${typeLabel} yang dihapus.`
                      }
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                rows.map((item, index) => (
                  <tr key={item.id}>
                    <td className="ta-c">
                      <span className="row-no">{offset + index + 1}</span>
                    </td>

                    <td>
                      <div className="who">
                        <RecycleIcon type={type} item={item} />
                        <div>
                          <b>{item.name}</b>
                          <small>{item.detail || "-"}</small>
                        </div>
                      </div>
                    </td>

                    <td className="hs">{item.deletedByName ?? "-"}</td>

                    <td className="muted hs">{item.deleteReason ?? "-"}</td>

                    <td>
                      <span
                        className="muted"
                        title={dateTime.format(new Date(item.deletedAt))}
                      >
                        {formatRelative(item.deletedAt)}
                      </span>
                    </td>

                    <td className="ta-r">
                      <div className="row-acts">
                        {busy === item.id ? <Spinner size={16} /> : null}
                        <RowActionMenu
                          label={`Aksi untuk ${item.name}`}
                          items={[
                            {
                              key: "history",
                              label: "Histori",
                              icon: History,
                              tone: "info",
                              onSelect: () =>
                                onShowHistory({
                                  entityType: type,
                                  entityId: item.id,
                                  name: item.name,
                                }),
                            },
                            can("restore") &&
                              busy !== item.id && {
                                key: "restore",
                                label: "Pulihkan",
                                icon: RotateCcw,
                                tone: "success",
                                onSelect: () => void restore(item),
                              },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DataPager
        page={current}
        pageSize={pageSize}
        total={filtered.length}
        unit="data"
        onPage={setPage}
        onPageSize={(next) => {
          setPageSize(next);
          setPage(1);
        }}
      />
    </div>
  );
}
