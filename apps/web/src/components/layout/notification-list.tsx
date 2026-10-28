"use client";

import {
  AppWindow,
  Bell,
  CircleCheck,
  KeyRound,
  LaptopMinimal,
  Lock,
  LockKeyhole,
  ShieldOff,
  Trash2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import type { PortalNotification } from "@/features/notifications/api";
import { formatRelative } from "@/lib/portal/format";
import styles from "./notification-list.module.css";

const KIND_ICONS: Record<string, LucideIcon> = {
  access_granted: AppWindow,
  access_revoked: ShieldOff,
  application_maintenance: Wrench,
  application_active: CircleCheck,
  new_device: LaptopMinimal,
  password_reset: KeyRound,
  account_locked: Lock,
  user_locked: LockKeyhole,
};

type NotificationListProps = Readonly<{
  items: PortalNotification[];
  loaded: boolean;
  onOpen: (notification: PortalNotification) => void;
  onRemove: (notification: PortalNotification) => void;
}>;

export function NotificationList({
  items,
  loaded,
  onOpen,
  onRemove,
}: NotificationListProps) {
  if (!loaded) {
    return (
      <div className={styles.state}>
        <Spinner size={18} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.state}>
        <b>Belum ada notifikasi</b>
        Perubahan akses dan peringatan keamanan akun Anda akan muncul di sini.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const classes = [
          "notice",
          styles.item,
          item.link ? styles.clickable : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = (
          <>
            <i className="ic">
              <Icon icon={KIND_ICONS[item.kind] ?? Bell} size={17} />
            </i>
            <div>
              <b>{item.title}</b>
              <p>{item.body}</p>
              <time dateTime={item.createdAt}>
                {formatRelative(item.createdAt)}
              </time>
            </div>
          </>
        );

        return (
          <div
            key={item.id}
            className={
              item.isRead ? styles.row : `${styles.row} ${styles.unread}`
            }
          >
            {item.link ? (
              <button
                className={classes}
                type="button"
                onClick={() => onOpen(item)}
              >
                {content}
              </button>
            ) : (
              <div className={classes}>{content}</div>
            )}

            <button
              className={styles.remove}
              type="button"
              aria-label={`Hapus notifikasi ${item.title}`}
              title="Hapus notifikasi"
              onClick={() => onRemove(item)}
            >
              <Icon icon={Trash2} size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
