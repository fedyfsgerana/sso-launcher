"use client";

import { useEffect, useState } from "react";
import { CircleCheck, History, Info, X } from "lucide-react";
import { OutcomeBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { AuditChangeList } from "@/components/management/audit-change-list";
import { EmptyState } from "@/components/portal/empty-state";
import { getAuditLogDetail, type AuditLogDetail } from "@/features/audit/api";
import { hasVersions } from "@/features/audit/versions-api";
import {
  actionIcon,
  actionLabel,
  actionTone,
  moduleLabel,
  outcomeLabel,
  targetLabel,
} from "@/lib/portal/audit-options";
import styles from "./audit-detail-modal.module.css";

export type VersionTarget = {
  entityType: string;
  entityId: string;
  name: string;
};

type AuditDetailModalProps = Readonly<{
  logId: string | null;
  onClose: () => void;
  onShowHistory?: (target: VersionTarget) => void;
}>;

type LoadedDetail = {
  id: string;
  detail: AuditLogDetail | null;
};

const fullDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "full",
  timeStyle: "medium",
});

function show(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

export function AuditDetailModal({
  logId,
  onClose,
  onShowHistory,
}: AuditDetailModalProps) {
  const [loaded, setLoaded] = useState<LoadedDetail | null>(null);

  useEffect(() => {
    if (!logId) {
      return;
    }

    let active = true;

    void getAuditLogDetail(logId)
      .then((detail) => {
        if (active) {
          setLoaded({ id: logId, detail });
        }
      })
      .catch(() => {
        if (active) {
          setLoaded({ id: logId, detail: null });
        }
      });

    return () => {
      active = false;
    };
  }, [logId]);

  useEffect(() => {
    if (!logId) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [logId, onClose]);

  if (logId === null) {
    return null;
  }

  const loading = loaded?.id !== logId;
  const detail = loaded?.id === logId ? loaded.detail : null;
  const historyTarget =
    onShowHistory && detail?.targetId && hasVersions(detail.targetType)
      ? {
          entityType: detail.targetType,
          entityId: detail.targetId,
          name: detail.targetName,
        }
      : null;

  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auditDetailTitle"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
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
            <h3 id="auditDetailTitle">
              {detail ? detail.targetName || "-" : "Detail Aktivitas"}
            </h3>
            <p>
              {detail
                ? `${actionLabel(detail.action)} · ${targetLabel(detail.targetType)} · ${moduleLabel(detail.module)}`
                : "Memuat catatan aktivitas"}
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
          ) : !detail ? (
            <EmptyState
              badge={Info}
              title="Detail tidak dapat dimuat"
              description="Coba tutup lalu buka lagi catatan ini."
              inPanel
            />
          ) : (
            <DetailBody detail={detail} />
          )}
        </div>

        <footer>
          {historyTarget && onShowHistory ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onShowHistory(historyTarget)}
            >
              Lihat Histori Versi
              <Icon icon={History} size={18} />
            </button>
          ) : null}

          <button className="btn" type="button" onClick={onClose}>
            Selesai
            <Icon icon={CircleCheck} size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
}

function DetailBody({ detail }: Readonly<{ detail: AuditLogDetail }>) {
  const browser = [detail.browser, detail.browserVersion]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={styles.badges}>
        <span className={`status ${actionTone(detail.action, detail.outcome)}`}>
          <Icon icon={actionIcon(detail.action)} size={13} />
          {actionLabel(detail.action)}
        </span>
        <OutcomeBadge
          failed={detail.outcome === "failed"}
          label={outcomeLabel(detail.outcome)}
        />
      </div>

      <div className={styles.summary}>
        {detail.summary || "Tidak ada keterangan."}
        {detail.reason ? (
          <div className={styles.reason}>
            <b>Alasan:</b> {detail.reason}
          </div>
        ) : null}
      </div>

      <section className={styles.section}>
        <h4>Dilakukan Oleh</h4>
        <div className="kv-list">
          <div className="kv">
            <span>Nama</span>
            <div>{show(detail.actorName)}</div>
          </div>
          <div className="kv">
            <span>Waktu</span>
            <div>{fullDateTime.format(new Date(detail.occurredAt))}</div>
          </div>
          <div className="kv">
            <span>Sesi</span>
            <div className={styles.code}>{show(detail.sessionRef)}</div>
          </div>
          <div className="kv">
            <span>Request</span>
            <div className={styles.code}>
              {detail.httpMethod
                ? `${detail.httpMethod} ${detail.requestPath ?? ""}`
                : "—"}
            </div>
          </div>
          <div className="kv">
            <span>ID Request</span>
            <div className={styles.code}>{show(detail.requestId)}</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h4>Perangkat</h4>
        <div className="kv-list">
          <div className="kv">
            <span>Alamat IP</span>
            <div className={styles.code}>{show(detail.ipAddress)}</div>
          </div>
          <div className="kv">
            <span>Nama Perangkat</span>
            <div>{show(detail.deviceName)}</div>
          </div>
          <div className="kv">
            <span>Jenis</span>
            <div>{show(detail.deviceType)}</div>
          </div>
          <div className="kv">
            <span>Sistem Operasi</span>
            <div>{show(detail.operatingSystem)}</div>
          </div>
          <div className="kv">
            <span>Browser</span>
            <div>{show(browser)}</div>
          </div>
          <div className="kv">
            <span>User Agent</span>
            <div className={styles.code}>{show(detail.userAgent)}</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h4>Perubahan Data</h4>
        {detail.changes.length === 0 ? (
          <p className={styles.note}>Aktivitas ini tidak mengubah isi data.</p>
        ) : (
          <AuditChangeList changes={detail.changes} />
        )}

        {detail.version !== null ? (
          <p className={styles.note}>
            Kondisi data setelah aktivitas ini tersimpan sebagai versi #
            {detail.version}.
          </p>
        ) : null}
      </section>
    </>
  );
}
