"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import type { PortalUser } from "@/features/users/api";
import { revokeUserSessions } from "@/features/users/security-api";
import styles from "./user-security-panel.module.css";

type UserSessionSectionProps = Readonly<{
  userId: string;
  user: PortalUser | null;
}>;

export function UserSessionSection({ userId, user }: UserSessionSectionProps) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [revoking, setRevoking] = useState(false);
  const name = user?.name ?? "pengguna ini";

  async function revoke() {
    const approved = await confirm({
      title: "Keluarkan dari semua sesi?",
      message: `${name} akan keluar dari semua perangkat dan harus masuk ulang.`,
      confirmLabel: "Keluarkan",
      danger: true,
      icon: LogOut,
    });

    if (!approved) {
      return;
    }

    setRevoking(true);

    try {
      const count = await revokeUserSessions(userId);
      showToast(
        count > 0
          ? `${count} sesi ${name} dicabut`
          : `${name} sedang tidak punya sesi aktif`,
      );
    } catch {
      showToast("Sesi gagal dicabut.", "error");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className={styles.sessionBody}>
      <div className="fs">
        <div className="fs-head fs-head-ic">
          <i className="ch-ic ic-danger">
            <Icon icon={LogOut} size={18} />
          </i>
          <div>
            <h4>Sesi Login</h4>
            <p>
              Keluarkan pengguna dari semua perangkat, misalnya saat
              perangkatnya hilang atau aksesnya dicurigai.
            </p>
          </div>
        </div>

        <p className="note-box warn">
          <span>
            <b>Pengguna harus login ulang di semua perangkat</b>
            Hanya sesi SSO Launcher yang dicabut. Aplikasi yang sudah dibuka
            lewat SSO memakai sesinya sendiri dan tidak ikut keluar.
          </span>
        </p>

        <div className={styles.actions}>
          <button
            className={
              revoking ? "btn tone-danger is-loading" : "btn tone-danger"
            }
            type="button"
            disabled={revoking}
            onClick={() => void revoke()}
          >
            {revoking ? "Mencabut" : "Keluarkan dari Semua Sesi"}
            {revoking ? (
              <Spinner size={16} />
            ) : (
              <Icon icon={LogOut} size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
