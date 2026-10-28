"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markNotificationsRead,
  type PortalNotification,
} from "@/features/notifications/api";

const POLL_MS = 30000;

export function useNotifications() {
  const pathname = usePathname();
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    function load() {
      if (document.visibilityState === "hidden") {
        return;
      }

      getNotifications()
        .then((result) => {
          if (active) {
            setItems(result.items);
            setUnread(result.unread);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) {
            setLoaded(true);
          }
        });
    }

    load();

    const timer = window.setInterval(load, POLL_MS);

    document.addEventListener("visibilitychange", load);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [pathname]);

  const openAndMarkRead = useCallback(async () => {
    try {
      const result = await getNotifications();

      setItems(result.items);
      setUnread(0);

      if (result.unread > 0) {
        await markNotificationsRead();
      }
    } catch {
      return;
    } finally {
      setLoaded(true);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const previous = items;

      setItems((value) => value.filter((item) => item.id !== id));
      setUnread((value) => {
        const target = previous.find((item) => item.id === id);

        return target && !target.isRead ? Math.max(0, value - 1) : value;
      });

      try {
        await deleteNotification(id);
      } catch (error) {
        setItems(previous);

        throw error;
      }
    },
    [items],
  );

  const clearAll = useCallback(async () => {
    const previous = items;
    const previousUnread = unread;

    setItems([]);
    setUnread(0);

    try {
      await clearNotifications();
    } catch (error) {
      setItems(previous);
      setUnread(previousUnread);

      throw error;
    }
  }, [items, unread]);

  return { items, unread, loaded, openAndMarkRead, remove, clearAll };
}
