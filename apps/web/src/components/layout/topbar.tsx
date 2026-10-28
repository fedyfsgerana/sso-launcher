"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppRouter } from "@/lib/portal/use-app-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  ChevronDown,
  CircleUser,
  LogOut,
  Settings,
  Trash2,
} from "lucide-react";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationList } from "@/components/layout/notification-list";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import { logout } from "@/features/auth/logout";
import { useNotifications } from "@/features/notifications/use-notifications";
import { initials, userRoleTag } from "@/lib/portal/format";
import { avatarColorClass } from "@/lib/portal/palette";
import brandLogo from "@/assets/brand/logo.webp";

type PopState = {
  kind: "notifications" | "account";
  top: number;
  left: number;
};

export function Topbar() {
  const router = useAppRouter();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { user, loading } = useAuthSession();
  const avatarClass = avatarColorClass(user?.name ?? "");
  const showSkeleton = useMinLoading(loading && !user);
  const [pop, setPop] = useState<PopState | null>(null);
  const notifications = useNotifications();
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  async function removeNotification(id: string) {
    try {
      await notifications.remove(id);
    } catch {
      showToast("Notifikasi gagal dihapus.", "error");
    }
  }

  async function clearNotifications() {
    const approved = await confirm({
      title: "Hapus semua notifikasi?",
      message:
        "Seluruh notifikasi Anda akan dihapus dan tidak bisa dibuka lagi.",
      confirmLabel: "Ya, Hapus",
      danger: true,
      icon: Trash2,
    });

    if (!approved) {
      return;
    }

    setPop(null);

    try {
      await notifications.clearAll();
      showToast("Semua notifikasi dihapus");
    } catch {
      showToast("Notifikasi gagal dihapus.", "error");
    }
  }

  useEffect(() => {
    function handleDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !wrapRef.current?.contains(target) &&
        !popRef.current?.contains(target)
      ) {
        setPop(null);
      }
    }

    function handleResize() {
      setPop(null);
    }

    document.addEventListener("mousedown", handleDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function togglePop(
    kind: "notifications" | "account",
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    if (pop?.kind === kind) {
      setPop(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(
      kind === "notifications" ? 380 : 300,
      window.innerWidth - 24,
    );

    if (kind === "notifications") {
      void notifications.openAndMarkRead();
    }

    setPop({
      kind,
      top: rect.bottom + 8,
      left: Math.max(
        12,
        Math.min(rect.right - width, window.innerWidth - width - 12),
      ),
    });
  }

  async function handleLogout() {
    setPop(null);

    const approved = await confirm({
      title: "Keluar dari portal?",
      message:
        "Sesi Anda akan diakhiri. Aplikasi yang sudah dibuka lewat portal tetap memakai sesinya masing-masing.",
      confirmLabel: "Ya, Keluar",
      danger: true,
      icon: LogOut,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    await logout().catch(() => undefined);

    router.replace("/login");
  }

  return (
    <header className="tb">
      <div className="tb-brand">
        {showSkeleton ? (
          <span className="brand is-loading" aria-hidden="true">
            <span className="sk sk-brand-ic" />
            <span className="sk sk-brand-line" />
          </span>
        ) : (
          <Link
            className="brand brand-link"
            href="/overview"
            aria-label="SSO Launcher, ke Beranda"
          >
            <Image className="tb-logo" src={brandLogo} alt="" priority />
            <span className="tb-divider" aria-hidden="true" />
            <span className="tb-brand-text">
              <b>
                SSO<span>LAUNCHER</span>
              </b>
              <small>Portal akses aplikasi</small>
            </span>
          </Link>
        )}
      </div>

      <GlobalSearch loading={showSkeleton} />

      <div className="tb-right" ref={wrapRef}>
        {showSkeleton ? (
          <span className="sk sk-icon-btn" aria-hidden="true" />
        ) : (
          <button
            className="icon-btn"
            type="button"
            aria-label={
              notifications.unread > 0
                ? `Notifikasi, ${notifications.unread} belum dibaca`
                : "Notifikasi"
            }
            onClick={(event) => togglePop("notifications", event)}
          >
            <Icon icon={Bell} size={22} />
            {notifications.unread > 0 ? <i className="dot" /> : null}
          </button>
        )}

        <button
          className="acct"
          type="button"
          aria-label="Menu akun"
          onClick={(event) => togglePop("account", event)}
        >
          {showSkeleton ? (
            <>
              <span className="sk sk-avatar sk-acct-av" />
              <span className="who-txt sk-acct-txt" aria-hidden="true">
                <span className="sk sk-line" />
                <span className="sk sk-line sm" />
              </span>
            </>
          ) : (
            <>
              <span className={`av js-av ${avatarClass}`}>
                {user ? initials(user.name) : "--"}
              </span>
              <span className="who-txt">
                <b className="js-name">{user?.name ?? "Memuat"}</b>
                <small className="js-dept">{userRoleTag(user)}</small>
              </span>
            </>
          )}

          <Icon icon={ChevronDown} size={18} />
        </button>

        {pop?.kind === "notifications"
          ? createPortal(
              <div
                className="menu-pop is-notifications"
                role="dialog"
                aria-label="Notifikasi"
                ref={popRef}
                style={{ top: pop.top, left: pop.left }}
              >
                <header className="notif-head">
                  <div>
                    <b>Notifikasi</b>
                    <small>
                      {notifications.unread > 0
                        ? `${notifications.unread} belum dibaca`
                        : "Semua sudah dibaca"}
                    </small>
                  </div>

                  {notifications.items.length > 0 ? (
                    <button
                      className="sm-btn danger"
                      type="button"
                      onClick={() => void clearNotifications()}
                    >
                      <Icon icon={Trash2} size={14} />
                      Hapus Semua
                    </button>
                  ) : null}
                </header>

                <NotificationList
                  items={notifications.items}
                  loaded={notifications.loaded}
                  onOpen={(notification) => {
                    setPop(null);

                    if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                  onRemove={(notification) =>
                    void removeNotification(notification.id)
                  }
                />
              </div>,
              document.body,
            )
          : null}

        {pop?.kind === "account"
          ? createPortal(
              <div
                className="menu-pop"
                role="menu"
                ref={popRef}
                style={{ top: pop.top, left: pop.left }}
              >
                <header className="acct-head">
                  <span className={`av ${avatarClass}`}>
                    {user ? initials(user.name) : "--"}
                  </span>
                  <div>
                    <b className="js-name">{user?.name}</b>
                    <small className="js-email">{userRoleTag(user)}</small>
                  </div>
                </header>

                <Link
                  className="mi"
                  href="/profile"
                  onClick={() => setPop(null)}
                >
                  <Icon icon={CircleUser} size={18} />
                  Profil Saya
                </Link>

                <Link
                  className="mi"
                  href="/settings"
                  onClick={() => setPop(null)}
                >
                  <Icon icon={Settings} size={18} />
                  Pengaturan
                </Link>

                <button
                  className="mi danger"
                  type="button"
                  onClick={handleLogout}
                >
                  <Icon icon={LogOut} size={18} />
                  Keluar
                </button>
              </div>,
              document.body,
            )
          : null}
      </div>
    </header>
  );
}
