"use client";

import { useEffect, useState } from "react";
import { CircleCheck, History, Info, Undo2, X } from "lucide-react";
import { AuditChangeList } from "@/components/management/audit-change-list";
import type { VersionTarget } from "@/components/management/audit-detail-modal";
import { useConfirm } from "@/components/portal/confirm-provider";
import { EmptyState } from "@/components/portal/empty-state";
import { useToast } from "@/components/portal/toast";
import { useMenuActions } from "@/lib/portal/use-menu-actions";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  canRollback,
  getVersions,
  isDeletedSnapshot,
  rollbackVersion,
  type DataVersion,
} from "@/features/audit/versions-api";
import { ApiError } from "@/lib/api/client";
import {
  actionIcon,
  actionLabel,
  actionTone,
  targetLabel,
} from "@/lib/portal/audit-options";
import styles from "./version-history-modal.module.css";

type VersionHistoryModalProps = Readonly<{
  target: VersionTarget | null;
  onClose: () => void;
  onChanged?: () => void;
}>;

type LoadedVersions = {
  key: string;
  versions: DataVersion[] | null;
};

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "medium",
});

function rollbackErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "Tidak bisa dikembalikan karena nama, email, slug, atau path pada versi itu sudah dipakai data lain.";
    }

    if (error.status === 400) {
      return "Versi ini tidak bisa dikembalikan.";
    }

    if (error.status === 403) {
      return "Anda tidak punya akses untuk mengembalikan versi.";
    }

    if (error.status === 404) {
      return "Data atau versi tidak ditemukan.";
    }
  }

  return "Versi gagal dikembalikan. Coba lagi.";
}

export function VersionHistoryModal({
  target,
  onClose,
  onChanged,
}: VersionHistoryModalProps) {
  const { confirmWithReason } = useConfirm();
  const { showToast } = useToast();
  const { can } = useMenuActions("audit");
  const [loaded, setLoaded] = useState<LoadedVersions | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [openVersion, setOpenVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const key = target
    ? `${target.entityType}:${target.entityId}:${reloadToken}`
    : null;

  useEffect(() => {
    if (!target || !key) {
      return;
    }

    let active = true;

    void getVersions(target.entityType, target.entityId)
      .then((versions) => {
        if (active) {
          setLoaded({ key, versions });
        }
      })
      .catch(() => {
        if (active) {
          setLoaded({ key, versions: null });
        }
      });

    return () => {
      active = false;
    };
  }, [key, target]);

  useEffect(() => {
    if (!target) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [target, onClose]);

  if (!target) {
    return null;
  }

  const loading = loaded?.key !== key;
  const versions = loaded?.key === key ? loaded.versions : null;
  const rollbackAllowed = canRollback(target.entityType) && can("rollback");

  async function rollback(version: DataVersion) {
    if (!target || busy) {
      return;
    }

    const reason = await confirmWithReason({
      title: `Kembalikan ke versi #${version.version}?`,
      message: `${target.name} akan dikembalikan ke kondisi versi #${version.version}, termasuk relasinya. Histori lama tetap tersimpan dan rollback dicatat sebagai versi baru.`,
      confirmLabel: "Ya, Kembalikan",
      icon: Undo2,
      reasonLabel: "Alasan rollback",
      reasonPlaceholder: "Masukkan alasan",
    });

    if (reason === null) {
      return;
    }

    setBusy(true);

    try {
      await rollbackVersion(
        target.entityType,
        target.entityId,
        version.version,
        reason,
      );
      showToast(`${target.name} dikembalikan ke versi #${version.version}`);
      setOpenVersion(null);
      setReloadToken((value) => value + 1);
      onChanged?.();
    } catch (error) {
      showToast(rollbackErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="versionHistoryTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div className={`modal-card mh-info ${styles.card}`}>
        <header>
          <span className="mh-ic">
            <Icon icon={History} size={20} />
          </span>

          <div>
            <h3 id="versionHistoryTitle">Histori Versi</h3>
            <p>
              {target.name || "-"} · {targetLabel(target.entityType)}
            </p>
          </div>

          <button
            className="icon-btn fm-close"
            type="button"
            aria-label="Tutup"
            onClick={onClose}
          >
            <Icon icon={X} size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {loading ? (
            <div className="empty">
              <Spinner size={20} />
            </div>
          ) : versions === null ? (
            <EmptyState
              badge={Info}
              title="Histori tidak dapat dimuat"
              description="Pastikan Anda punya akses menu Riwayat Aktivitas."
              inPanel
            />
          ) : versions.length === 0 ? (
            <EmptyState
              title="Belum ada versi"
              description="Versi terbentuk saat data ditambah, diubah, dihapus, atau dipulihkan."
              inPanel
            />
          ) : (
            <div className={styles.list}>
              {versions.map((version) => {
                const open = openVersion === version.version;
                const deleted = isDeletedSnapshot(version);

                return (
                  <div
                    className={
                      open ? `${styles.item} ${styles.open}` : styles.item
                    }
                    key={version.version}
                  >
                    <button
                      className={styles.head}
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setOpenVersion(open ? null : version.version)
                      }
                    >
                      <span className={styles.number}>#{version.version}</span>

                      <span className={styles.meta}>
                        <span className={styles.line}>
                          <span
                            className={`status ${actionTone(version.action)}`}
                          >
                            <Icon icon={actionIcon(version.action)} size={13} />
                            {actionLabel(version.action)}
                          </span>
                          {version.isCurrent ? (
                            <span className={styles.current}>
                              Versi saat ini
                            </span>
                          ) : null}
                        </span>

                        <small>
                          {version.actorName || "Sistem"} ·{" "}
                          {dateTime.format(new Date(version.createdAt))}
                        </small>

                        {version.summary ? (
                          <span className={styles.summary}>
                            {version.summary}
                          </span>
                        ) : null}
                      </span>
                    </button>

                    {open ? (
                      <div className={styles.detail}>
                        {version.reason ? (
                          <div className={styles.reason}>
                            <b>Alasan:</b> {version.reason}
                          </div>
                        ) : null}

                        {version.changes.length === 0 ? (
                          <p className={styles.note}>
                            Tidak ada perbedaan dengan versi sebelumnya.
                          </p>
                        ) : (
                          <AuditChangeList changes={version.changes} />
                        )}

                        {version.isCurrent ? (
                          <p className={styles.note}>
                            Ini kondisi data yang sedang berlaku.
                          </p>
                        ) : !rollbackAllowed ? (
                          <p className={styles.note}>
                            Jenis data ini hanya bisa dilihat historinya.
                          </p>
                        ) : deleted ? (
                          <p className={styles.note}>
                            Versi ini berstatus terhapus. Gunakan tab Tempat
                            Sampah untuk memulihkan data.
                          </p>
                        ) : (
                          <div className={styles.actions}>
                            <button
                              className={
                                busy
                                  ? "btn tone-warn is-loading"
                                  : "btn tone-warn"
                              }
                              type="button"
                              disabled={busy}
                              onClick={() => void rollback(version)}
                            >
                              Kembalikan ke versi ini
                              {busy ? (
                                <Spinner size={16} />
                              ) : (
                                <Icon icon={Undo2} size={18} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer>
          <button className="btn" type="button" onClick={onClose}>
            Selesai
            <Icon icon={CircleCheck} size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
}
