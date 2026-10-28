"use client";

import Link from "next/link";
import { Laptop, LogOut, MonitorCheck, Smartphone } from "lucide-react";
import { SettingsCard } from "@/components/portal/settings/settings-card";
import { BlockSkeleton } from "@/components/portal/skeleton";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import type { AccountSession } from "@/features/account/api";
import {
  describeLocation,
  describeSession,
  isMobileSession,
} from "@/features/account/session-labels";
import { OTHER_SESSIONS } from "@/features/account/use-account-settings";
import styles from "./settings.module.css";
import { Badge } from "@/components/ui/status-badge";

type SessionCardProps = Readonly<{
  sessions: AccountSession[] | null;
  otherSessions: number;
  revoking: string | null;
  onSignOut: (session: AccountSession) => void;
  onSignOutOthers: () => void;
}>;

export function SessionCard({
  sessions,
  otherSessions,
  revoking,
  onSignOut,
  onSignOutOthers,
}: SessionCardProps) {
  return (
    <SettingsCard
      tone="app-as"
      title="Sesi & Perangkat"
      icon={Laptop}
      subtitle="Perangkat yang sedang masuk ke akun Anda"
      action={
        otherSessions > 0 ? (
          <button
            className="ac-btn danger"
            type="button"
            disabled={revoking !== null}
            onClick={onSignOutOthers}
          >
            {revoking === OTHER_SESSIONS ? (
              <Spinner size={15} />
            ) : (
              <Icon icon={LogOut} size={15} />
            )}
            Keluar dari perangkat lain
          </button>
        ) : null
      }
    >
      {sessions === null ? (
        <BlockSkeleton lines={4} />
      ) : (
        <ul className={styles.sessions}>
          {sessions.map((session) => (
            <li key={session.id} className={styles.session}>
              <span className="rc-ic sm app-as">
                <Icon
                  icon={isMobileSession(session) ? Smartphone : Laptop}
                  size={18}
                />
              </span>

              <span className={styles.sessionText}>
                <b>
                  {describeSession(session)}
                  {session.isCurrent ? (
                    <Badge tone="on" icon={MonitorCheck}>
                      Perangkat ini
                    </Badge>
                  ) : null}
                </b>
                <small>{describeLocation(session)}</small>
              </span>

              {session.isCurrent ? null : (
                <button
                  className="sm-btn danger"
                  type="button"
                  disabled={revoking !== null}
                  onClick={() => onSignOut(session)}
                >
                  {revoking === session.id ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon icon={LogOut} size={14} />
                  )}
                  Keluarkan
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className={`note-box ${styles.note}`}>
        <span>
          Untuk mengganti password, buka{" "}
          <Link href="/profile">Profil Saya</Link>.
        </span>
      </p>
    </SettingsCard>
  );
}
