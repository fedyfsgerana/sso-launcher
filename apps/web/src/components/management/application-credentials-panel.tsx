"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleCheck,
  Clock3,
  Copy,
  FileDown,
  Key,
  Trash2,
  X,
} from "lucide-react";
import { PickCheck } from "@/components/management/pick-check";
import { Badge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/portal/confirm-provider";
import { EmptyState } from "@/components/portal/empty-state";
import { TableSkeleton } from "@/components/portal/skeleton";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { RowActionMenu } from "@/components/ui/row-action-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  claimIntegrationGuide,
  createCredential,
  deleteCredential,
  discardCredential,
  fillIntegrationTemplate,
  getCredentials,
  revokeCredential,
  type CreatedCredential,
  type ServiceCredential,
} from "@/features/applications/credentials-api";
import { ApiError } from "@/lib/api/client";
import { ActivateIcon, DeactivateIcon } from "@/lib/portal/action-icons";
import { downloadText } from "@/lib/portal/download";
import { formatRelative } from "@/lib/portal/format";
import { useRowSelection } from "@/lib/portal/use-row-selection";
import styles from "./application-credentials-panel.module.css";

type ApplicationCredentialsPanelProps = Readonly<{
  applicationId: string;
  applicationName: string;
  callbackUrl: string | null;
}>;

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function CopyField({
  label,
  value,
  onCopy,
}: Readonly<{ label: string; value: string; onCopy?: () => void }>) {
  const [copied, setCopied] = useState(false);

  return (
    <label className="fld">
      <span>{label}</span>
      <div className={styles.field}>
        <input
          value={value}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          className="sm-btn"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              onCopy?.();
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          <Icon icon={copied ? Check : Copy} size={15} />
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
    </label>
  );
}

function CredentialStatus({
  credential,
}: Readonly<{ credential: ServiceCredential }>) {
  if (!credential.isActive) {
    return (
      <Badge tone="off" icon={DeactivateIcon}>
        Dicabut
      </Badge>
    );
  }

  return credential.lastUsedAt ? (
    <Badge tone="on" icon={ActivateIcon}>
      Aktif · Terpakai
    </Badge>
  ) : (
    <Badge tone="warn" icon={Clock3}>
      Aktif · Belum dipakai
    </Badge>
  );
}

function latest(values: (string | null)[]) {
  return (
    values
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null
  );
}

export function ApplicationCredentialsPanel({
  applicationId,
  applicationName,
  callbackUrl,
}: ApplicationCredentialsPanelProps) {
  const { confirm, confirmWithReason } = useConfirm();
  const { showToast } = useToast();
  const [credentials, setCredentials] = useState<ServiceCredential[] | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedCredential | null>(null);
  const [guideDownloaded, setGuideDownloaded] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState<ServiceCredential | null>(null);
  const selection = useRowSelection(
    (credentials ?? []).map((credential) => credential.id),
  );
  const picked = (credentials ?? []).filter((credential) =>
    selection.isSelected(credential.id),
  );
  const pickedActive = picked.filter((credential) => credential.isActive);
  const pickedRevoked = picked.filter((credential) => !credential.isActive);

  const reload = useCallback(async () => {
    setCredentials(
      await getCredentials(applicationId).catch(
        () => [] as ServiceCredential[],
      ),
    );
  }, [applicationId]);

  useEffect(() => {
    let active = true;

    void getCredentials(applicationId)
      .catch(() => [] as ServiceCredential[])
      .then((list) => {
        if (active) {
          setCredentials(list);
        }
      });

    return () => {
      active = false;
    };
  }, [applicationId]);

  async function create() {
    const approved = await confirm({
      title: "Buat kredensial baru?",
      message:
        "Client ID, Client Secret, dan Panduan Integrasi hanya bisa diambil sekali dari jendela berikutnya. Siapkan tempat menyimpannya.",
      confirmLabel: "Ya, Buat",
      icon: Key,
      tone: "info",
    });

    if (!approved) {
      return;
    }

    setCreating(true);

    try {
      const result = await createCredential(applicationId);
      setGuideDownloaded(false);
      setSecretCopied(false);
      setCreated(result);
      await reload();
    } catch {
      showToast("Kredensial gagal dibuat.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function downloadGuide(credential: CreatedCredential) {
    setDownloading(true);

    try {
      const file = fillIntegrationTemplate(
        await claimIntegrationGuide(credential.id),
        credential,
      );

      downloadText(file.fileName, file.content);
      setGuideDownloaded(true);
      showToast(`Panduan integrasi diunduh: ${file.fileName}`);
      await reload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setGuideDownloaded(true);
        showToast(
          "Panduan untuk kredensial ini sudah pernah diunduh.",
          "warning",
        );
        return;
      }

      showToast("Panduan integrasi gagal diunduh.", "error");
    } finally {
      setDownloading(false);
    }
  }

  function copyBoth(credential: CreatedCredential) {
    void navigator.clipboard
      .writeText(
        `Client ID: ${credential.clientId}\nClient Secret: ${credential.clientSecret}`,
      )
      .then(() => {
        setSecretCopied(true);
        showToast("Client ID dan Client Secret disalin");
      })
      .catch(() => showToast("Kredensial gagal disalin.", "error"));
  }

  async function cancelCreated(credential: CreatedCredential) {
    const approved = await confirm({
      title: "Batalkan kredensial ini?",
      message:
        "Anda belum menandai kredensial sudah disimpan. Kalau dibatalkan, kredensial dihapus dan Panduan Integrasi yang sudah terunduh tidak bisa dipakai.",
      confirmLabel: "Ya, Batalkan",
      cancelLabel: "Kembali",
      danger: true,
      action: "delete",
    });

    if (!approved) {
      return;
    }

    try {
      await discardCredential(credential.id);
      setCreated(null);
      await reload();
      showToast("Kredensial dibatalkan");
    } catch {
      showToast("Kredensial gagal dibatalkan.", "error");
    }
  }

  async function revoke(credential: ServiceCredential) {
    const reason = await confirmWithReason({
      title: "Cabut kredensial?",
      message: `${applicationName} tidak bisa lagi memvalidasi token SSO memakai ${credential.clientId}. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: "Cabut",
      danger: true,
      action: "deactivate",
      tone: "danger",
      reasonLabel: "Alasan pencabutan",
      reasonPlaceholder: "Masukkan alasan pencabutan",
    });

    if (reason === null) {
      return;
    }

    try {
      await revokeCredential(credential.id, reason);
      await reload();
      showToast("Kredensial dicabut");
    } catch {
      showToast("Kredensial gagal dicabut.", "error");
    }
  }

  async function remove(credential: ServiceCredential) {
    const reason = await confirmWithReason({
      title: "Hapus kredensial?",
      message: `${credential.clientId} sudah dicabut dan akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: "Hapus",
      danger: true,
      action: "delete",
      reasonLabel: "Alasan penghapusan",
      reasonPlaceholder: "Masukkan alasan penghapusan",
    });

    if (reason === null) {
      return;
    }

    try {
      await deleteCredential(credential.id, reason);
      setViewing(null);
      selection.toggleOne(credential.id, false);
      await reload();
      showToast("Kredensial dihapus");
    } catch {
      showToast("Kredensial gagal dihapus.", "error");
    }
  }

  async function revokeMany() {
    const reason = await confirmWithReason({
      title: `Cabut ${pickedActive.length} kredensial?`,
      message: `${applicationName} tidak bisa lagi memvalidasi token SSO memakai kredensial terpilih. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: "Cabut",
      danger: true,
      action: "deactivate",
      tone: "danger",
      reasonLabel: "Alasan pencabutan",
      reasonPlaceholder: "Masukkan alasan pencabutan",
    });

    if (reason === null) {
      return;
    }

    const results = await Promise.allSettled(
      pickedActive.map((credential) => revokeCredential(credential.id, reason)),
    );

    await finishBulk(results, "dicabut");
  }

  async function removeMany() {
    const reason = await confirmWithReason({
      title: `Hapus ${pickedRevoked.length} kredensial?`,
      message:
        "Kredensial terpilih yang sudah dicabut akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus",
      danger: true,
      action: "delete",
      reasonLabel: "Alasan penghapusan",
      reasonPlaceholder: "Masukkan alasan penghapusan",
    });

    if (reason === null) {
      return;
    }

    const results = await Promise.allSettled(
      pickedRevoked.map((credential) =>
        deleteCredential(credential.id, reason),
      ),
    );

    await finishBulk(results, "dihapus");
  }

  async function finishBulk(
    results: PromiseSettledResult<void>[],
    verb: string,
  ) {
    const failed = results.filter((result) => result.status === "rejected");

    selection.clear();
    await reload();

    showToast(
      failed.length === 0
        ? `${results.length} kredensial ${verb}`
        : `${results.length - failed.length} kredensial ${verb}, ${failed.length} gagal.`,
      failed.length === 0 ? "success" : "error",
    );
  }

  const list = credentials ?? [];
  const active = list.filter((item) => item.isActive);
  const unused = active.filter((item) => !item.lastUsedAt);
  const lastUsed = latest(list.map((item) => item.lastUsedAt));
  const lastUsedBy = list.find((item) => item.lastUsedAt === lastUsed);
  const connection =
    active.length === 0
      ? {
          tone: styles.off,
          label: "Belum terhubung",
          hint: "Buat kredensial untuk aplikasi ini",
        }
      : active.length > unused.length
        ? {
            tone: styles.on,
            label: "Terhubung",
            hint: "Kredensial aktif sudah dipakai server aplikasi",
          }
        : {
            tone: styles.wait,
            label: "Menunggu dipakai",
            hint: "Pasang kredensial di server aplikasi",
          };
  const ready = guideDownloaded || secretCopied;

  return (
    <div className="pk-panel">
      <div className={styles.overview}>
        <section className={styles.summary} aria-label="Ringkasan koneksi">
          <div className={styles.stat}>
            <span className={styles.statLabel}>Status koneksi</span>
            <span className={styles.statValue}>
              <span className={`${styles.dot} ${connection.tone}`} />
              {connection.label}
            </span>
            <span className={styles.statHint}>{connection.hint}</span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>Kredensial aktif</span>
            <span className={styles.statValue}>{active.length}</span>
            <span
              className={
                unused.length > 0
                  ? `${styles.statHint} ${styles.warn}`
                  : styles.statHint
              }
            >
              {unused.length > 0
                ? `${unused.length} belum pernah dipakai`
                : active.length > 0
                  ? "Semua sudah dipakai"
                  : "Belum ada"}
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>Terakhir dipakai</span>
            <span
              className={styles.statValue}
              title={lastUsed ? dateTime.format(new Date(lastUsed)) : undefined}
            >
              {lastUsed ? formatRelative(lastUsed) : "Belum pernah"}
            </span>
            <span className={`${styles.statHint} ${styles.mono}`}>
              {lastUsedBy?.clientId ?? "-"}
            </span>
          </div>

          <div className={styles.stat}>
            <span className={styles.statLabel}>Alamat callback</span>
            <span
              className={`${styles.statValue} ${styles.mono}`}
              title={callbackUrl ?? undefined}
            >
              {callbackUrl ?? "-"}
            </span>
            <span className={styles.statHint}>
              Disusun dari Alamat Aplikasi
            </span>
          </div>
        </section>

        <section className={styles.steps} aria-label="Alur serah terima">
          <div className={styles.step}>
            <span className={styles.stepNo}>1</span>
            <span>
              <b>Buat kredensial</b>
              Client ID dan Secret tampil satu kali di jendela Kredensial
              Dibuat.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNo}>2</span>
            <span>
              <b>Unduh Panduan Integrasi</b>
              Hanya sekali, dari jendela itu. Butuh lagi? Buat kredensial baru.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNo}>3</span>
            <span>
              <b>Serahkan, lalu cabut yang lama</b>
              Setelah kredensial baru terpakai, cabut kredensial sebelumnya.
            </span>
          </div>
        </section>
      </div>

      <div className={`ma-bar pk-bar ${styles.bar}`}>
        <div className={styles.barTitle}>
          <b>Daftar Kredensial</b>
          <span>{list.length} kredensial</span>
        </div>

        <button
          className={creating ? "btn tone-info is-loading" : "btn tone-info"}
          type="button"
          disabled={creating}
          onClick={() => void create()}
        >
          {creating ? "Membuat" : "Buat Kredensial"}
          {creating ? <Spinner size={16} /> : <Icon icon={Key} size={18} />}
        </button>
      </div>

      {picked.length > 0 ? (
        <div className="bulk">
          <span>{picked.length} kredensial dipilih</span>

          {pickedActive.length > 0 ? (
            <button
              className="ac-btn danger"
              type="button"
              onClick={() => void revokeMany()}
            >
              Cabut
              <Icon icon={DeactivateIcon} size={15} />
            </button>
          ) : null}

          {pickedRevoked.length > 0 ? (
            <button
              className="ac-btn danger"
              type="button"
              onClick={() => void removeMany()}
            >
              Hapus
              <Icon icon={Trash2} size={15} />
            </button>
          ) : null}
        </div>
      ) : null}

      {credentials === null ? (
        <TableSkeleton rows={3} columns={7} />
      ) : (
        <div className="table-wrap">
          <table className="dt ut">
            <thead>
              <tr>
                <th className="ck">
                  <PickCheck
                    label="Pilih semua kredensial"
                    checked={selection.allChecked}
                    indeterminate={selection.someChecked}
                    onChange={selection.toggleAll}
                  />
                </th>
                <th className="ta-c">No</th>
                <th>Client ID</th>
                <th>Status</th>
                <th className="hs">Panduan</th>
                <th className="hs">Dibuat</th>
                <th className="hs">Terakhir Dipakai</th>
                <th className="ta-r">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Belum ada kredensial"
                      description="Buat kredensial agar aplikasi bisa memvalidasi token SSO dari SSO Launcher."
                      inPanel
                    />
                  </td>
                </tr>
              ) : (
                credentials.map((credential, index) => (
                  <tr
                    key={credential.id}
                    className={[
                      styles.row,
                      selection.isSelected(credential.id) ? "sel" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    tabIndex={0}
                    onClick={() => setViewing(credential)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setViewing(credential);
                      }
                    }}
                  >
                    <td
                      className="ck"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <PickCheck
                        label={`Pilih ${credential.clientId}`}
                        checked={selection.isSelected(credential.id)}
                        onChange={(checked) =>
                          selection.toggleOne(credential.id, checked)
                        }
                      />
                    </td>
                    <td className="ta-c">
                      <span className="row-no">{index + 1}</span>
                    </td>
                    <td>
                      <code className="path">{credential.clientId}</code>
                    </td>
                    <td>
                      <CredentialStatus credential={credential} />
                    </td>
                    <td className="hs">
                      {credential.guideDownloadedAt ? (
                        <span
                          className={styles.done}
                          title={dateTime.format(
                            new Date(credential.guideDownloadedAt),
                          )}
                        >
                          <Icon icon={Check} size={15} />
                          Sudah diunduh
                        </span>
                      ) : (
                        <span className="muted">Tidak diunduh</span>
                      )}
                    </td>
                    <td
                      className="muted hs"
                      title={dateTime.format(new Date(credential.createdAt))}
                    >
                      {formatRelative(credential.createdAt)}
                    </td>
                    <td className="muted hs">
                      {credential.lastUsedAt ? (
                        <span
                          title={dateTime.format(
                            new Date(credential.lastUsedAt),
                          )}
                        >
                          {formatRelative(credential.lastUsedAt)}
                        </span>
                      ) : (
                        "Belum pernah"
                      )}
                    </td>
                    <td
                      className="ta-r"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="row-acts">
                        <RowActionMenu
                          label={`Aksi untuk ${credential.clientId}`}
                          items={[
                            credential.isActive
                              ? {
                                  key: "revoke",
                                  label: "Cabut",
                                  icon: DeactivateIcon,
                                  tone: "danger",
                                  onSelect: () => void revoke(credential),
                                }
                              : {
                                  key: "delete",
                                  label: "Hapus",
                                  icon: Trash2,
                                  tone: "danger",
                                  onSelect: () => void remove(credential),
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

      {viewing ? (
        <div
          className="modal show"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cvTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setViewing(null);
            }
          }}
        >
          <div className="modal-card dup-card mh-info">
            <header>
              <span className="mh-ic">
                <Icon icon={Key} size={20} />
              </span>

              <div>
                <h3 id="cvTitle">Detail Kredensial</h3>
                <p>Kredensial {applicationName} untuk memvalidasi token SSO.</p>
              </div>

              <button
                className="icon-btn fm-close"
                type="button"
                aria-label="Tutup"
                onClick={() => setViewing(null)}
              >
                <Icon icon={X} size={18} />
              </button>
            </header>

            <div className={`dup-body ${styles.body}`}>
              <CopyField label="Client ID" value={viewing.clientId} />

              <p className="note-box">
                <span>
                  <b>
                    Client Secret dan Panduan Integrasi tidak bisa diambil lagi
                  </b>
                  Keduanya hanya tersedia sekali saat kredensial dibuat. Kalau
                  hilang, buat kredensial baru lalu cabut yang ini.
                </span>
              </p>
            </div>

            <footer>
              <button
                className="btn"
                type="button"
                onClick={() => setViewing(null)}
              >
                Selesai
                <Icon icon={CircleCheck} size={18} />
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {created ? (
        <div
          className="modal show"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crTitle"
        >
          <div className="modal-card dup-card mh-info">
            <header>
              <span className="mh-ic">
                <Icon icon={Key} size={20} />
              </span>

              <div>
                <h3 id="crTitle">Kredensial Dibuat</h3>
                <p>Kredensial baru untuk {applicationName}.</p>
              </div>

              <button
                className="icon-btn fm-close"
                type="button"
                aria-label="Tutup"
                onClick={() => void cancelCreated(created)}
              >
                <Icon icon={X} size={18} />
              </button>
            </header>

            <div className={`dup-body ${styles.body}`}>
              <p className="note-box warn">
                Client Secret dan Panduan Integrasi hanya bisa diambil sekali,
                dari jendela ini. Kalau terlewat, buat kredensial baru.
              </p>

              <CopyField label="Client ID" value={created.clientId} />
              <CopyField
                label="Client Secret"
                value={created.clientSecret}
                onCopy={() => setSecretCopied(true)}
              />

              <div className={styles.guide}>
                <span className={styles.guideIc}>
                  <Icon icon={FileDown} size={20} />
                </span>
                <span className={styles.guideText}>
                  <b>Panduan Integrasi</b>
                  Berisi Client ID, Client Secret, pengaturan server, dan
                  panduan SSO lengkap untuk tim aplikasi.
                </span>
                {guideDownloaded ? (
                  <span className={styles.done}>
                    <Icon icon={Check} size={16} />
                    Sudah diunduh
                  </span>
                ) : (
                  <button
                    className={
                      downloading
                        ? "btn tone-success is-loading"
                        : "btn tone-success"
                    }
                    type="button"
                    disabled={downloading}
                    onClick={() => void downloadGuide(created)}
                  >
                    {downloading ? "Menyiapkan" : "Unduh"}
                    {downloading ? (
                      <Spinner size={16} />
                    ) : (
                      <Icon icon={FileDown} size={18} />
                    )}
                  </button>
                )}
              </div>
            </div>

            <footer>
              <span className={styles.footHint}>
                {ready
                  ? "Kredensial siap. Klik Sudah Saya Simpan untuk menyelesaikan."
                  : "Unduh panduan atau salin secret dulu."}
              </span>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => copyBoth(created)}
              >
                Salin Keduanya
                <Icon icon={Copy} size={18} />
              </button>
              <button
                className="btn tone-info"
                type="button"
                disabled={!ready}
                onClick={() => setCreated(null)}
              >
                Sudah Saya Simpan
                <Icon icon={Key} size={18} />
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
