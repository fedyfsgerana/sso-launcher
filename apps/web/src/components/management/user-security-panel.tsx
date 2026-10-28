"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  LockOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useToast } from "@/components/portal/toast";
import { queueToast } from "@/lib/portal/pending-toast";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  getUserLoginLock,
  resetUserPassword,
  unlockUserLogin,
  type LoginLock,
} from "@/features/users/security-api";
import type { PortalUser } from "@/features/users/api";
import { generatePassword } from "@/lib/portal/password";
import passwordStyles from "@/components/ui/password-input.module.css";
import { PasswordChecklist } from "@/components/ui/password-checklist";
import { isStrongPassword, passwordError } from "@/lib/portal/password-rules";
import { UserSessionSection } from "./user-session-section";
import styles from "./user-security-panel.module.css";

type UserSecurityPanelProps = Readonly<{
  userId: string;
  user: PortalUser | null;
}>;

function formatUntil(value: string) {
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserSecurityPanel({ userId, user }: UserSecurityPanelProps) {
  const { confirm } = useConfirm();
  const router = useAppRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [visible, setVisible] = useState(false);
  const [repeatVisible, setRepeatVisible] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [lock, setLock] = useState<LoginLock | null>(null);
  const [lockFailed, setLockFailed] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const name = user?.name ?? "pengguna ini";

  useEffect(() => {
    let active = true;

    getUserLoginLock(userId)
      .then((value) => {
        if (active) {
          setLock(value);
          setLockFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setLockFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  function checkPassword() {
    if (!password) {
      return;
    }

    setError(passwordError(password));
  }

  function checkRepeat() {
    if (!repeat) {
      return;
    }

    setError(password === repeat ? undefined : "Ulangi password belum sama.");
  }

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const invalid = passwordError(password);

    if (invalid) {
      setError(invalid);
      return;
    }

    if (password !== repeat) {
      setError("Ulangi password belum sama.");
      return;
    }

    const approved = await confirm({
      title: "Atur ulang password?",
      message: `Password ${name} akan diganti dan semua sesinya dicabut, sehingga ia harus masuk ulang dengan password baru.`,
      confirmLabel: "Atur Ulang",
      danger: true,
      icon: KeyRound,
    });

    if (!approved) {
      return;
    }

    setSaving(true);

    try {
      await resetUserPassword(userId, password);
      setPassword("");
      setRepeat("");
      setError(undefined);
      queueToast(`Password ${name} diatur ulang`);
      router.push("/users");
    } catch {
      showToast("Password gagal diatur ulang.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function unlock() {
    const approved = await confirm({
      title: "Buka kunci login?",
      message: `Hitungan percobaan login gagal ${name} akan dihapus, sehingga ${name} bisa langsung masuk lagi.`,
      confirmLabel: "Buka Kunci",
      icon: LockOpen,
    });

    if (!approved) {
      return;
    }

    setUnlocking(true);

    try {
      await unlockUserLogin(userId);
      setLock(await getUserLoginLock(userId));
      showToast(`Kunci login ${name} dibuka`);
    } catch {
      showToast("Kunci login gagal dibuka.", "error");
    } finally {
      setUnlocking(false);
    }
  }

  const lockItems = lock
    ? [
        ...(lock.accountLockedUntil
          ? [
              {
                key: "account",
                label: "Semua komputer",
                detail: `sampai ${formatUntil(lock.accountLockedUntil)}`,
              },
            ]
          : []),
        ...lock.lockedAddresses.map((item) => ({
          key: item.ipAddress,
          label: item.ipAddress,
          detail: `${item.failures} kali gagal, sampai ${formatUntil(item.lockedUntil)}`,
        })),
      ]
    : [];

  return (
    <>
      <div className="fs">
        <div className="fs-head fs-head-ic">
          <i className="ch-ic">
            <Icon icon={ShieldCheck} size={18} />
          </i>
          <div>
            <h4>Kunci Login</h4>
            <p>
              Login dikunci sementara setelah terlalu banyak percobaan password
              salah. Buka kuncinya kalau pengguna yang sah tidak bisa masuk.
            </p>
          </div>
        </div>

        {lockFailed ? (
          <p className={styles.lockHint}>Status kunci login gagal dimuat.</p>
        ) : lock === null ? (
          <Spinner size={18} />
        ) : (
          <div className={lock.isLocked ? "note-box danger" : "note-box ok"}>
            <span>
              <b>
                {lock.isLocked ? "Login sedang dikunci" : "Login tidak dikunci"}
              </b>

              {lock.recentFailures > 0
                ? `${lock.recentFailures} percobaan gagal dalam 15 menit terakhir.`
                : "Tidak ada percobaan gagal dalam 15 menit terakhir."}

              {lockItems.length > 0 ? (
                <ul className={styles.lockList}>
                  {lockItems.map((item) => (
                    <li key={item.key}>
                      <code>{item.label}</code>
                      <span>{item.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </span>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={unlocking ? "btn is-loading" : "btn"}
            type="button"
            disabled={unlocking || !lock || lock.recentFailures === 0}
            onClick={() => void unlock()}
          >
            {unlocking ? "Membuka" : "Buka Kunci"}
            {unlocking ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={LockOpen} size={18} />
            )}
          </button>
        </div>
      </div>

      <form className="fs" onSubmit={submit}>
        <div className="fs-head fs-head-ic">
          <i className="ch-ic ic-warn">
            <Icon icon={KeyRound} size={18} />
          </i>
          <div>
            <h4>Atur Ulang Password</h4>
            <p>
              Dipakai saat pengguna lupa password. Semua sesinya otomatis
              dicabut.
            </p>
          </div>
        </div>

        <div className="fs-grid">
          <label className={error ? "fld has-error" : "fld"}>
            <span>Password Baru</span>
            <div className={passwordStyles.field}>
              <input
                type={visible ? "text" : "password"}
                value={password}
                autoComplete="new-password"
                placeholder="Masukkan password baru"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(undefined);
                }}
                onBlur={checkPassword}
              />
              <button
                type="button"
                className={passwordStyles.eye}
                aria-label={visible ? "Sembunyikan" : "Tampilkan"}
                onClick={() => setVisible((value) => !value)}
              >
                <Icon icon={visible ? EyeOff : Eye} size={16} />
              </button>
            </div>
            <PasswordChecklist value={password} />
          </label>

          <label className={error ? "fld has-error" : "fld"}>
            <span>Ulangi Password</span>
            <div className={passwordStyles.field}>
              <input
                type={repeatVisible ? "text" : "password"}
                value={repeat}
                autoComplete="new-password"
                placeholder="Masukkan ulang password baru"
                onChange={(event) => {
                  setRepeat(event.target.value);
                  setError(undefined);
                }}
                onBlur={checkRepeat}
              />
              <button
                type="button"
                className={passwordStyles.eye}
                aria-label={repeatVisible ? "Sembunyikan" : "Tampilkan"}
                onClick={() => setRepeatVisible((value) => !value)}
              >
                <Icon icon={repeatVisible ? EyeOff : Eye} size={16} />
              </button>
            </div>
            {error ? <em className="fld-msg">{error}</em> : null}
          </label>
        </div>

        <div className={styles.actions}>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              const next = generatePassword();
              setPassword(next);
              setRepeat(next);
              setVisible(true);
              setRepeatVisible(true);
              setError(undefined);
            }}
          >
            Buat Password Acak
            <Icon icon={Sparkles} size={18} />
          </button>

          <button
            className={saving ? "btn tone-warn is-loading" : "btn tone-warn"}
            type="submit"
            disabled={
              saving || !isStrongPassword(password) || password !== repeat
            }
          >
            {saving ? "Menyimpan" : "Atur Ulang Password"}
            {saving ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={KeyRound} size={18} />
            )}
          </button>
        </div>
      </form>

      <UserSessionSection userId={userId} user={user} />
    </>
  );
}
