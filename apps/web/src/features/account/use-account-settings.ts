"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useConfirm } from "@/components/portal/confirm-provider";
import { useToast } from "@/components/portal/toast";
import {
  getNotificationSettings,
  getSecurityPolicy,
  getSessions,
  revokeOtherSessions,
  revokeSession,
  updateNotificationSettings,
  type AccountSession,
  type NotificationSettings,
  type SecurityPolicy,
} from "@/features/account/api";
import { describeSession } from "@/features/account/session-labels";

export const OTHER_SESSIONS = "others";

export function useAccountSettings() {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AccountSession[] | null>(null);
  const [preferences, setPreferences] = useState<NotificationSettings | null>(
    null,
  );
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getSessions()
      .then((value) => active && setSessions(value))
      .catch(() => active && setSessions([]));

    getNotificationSettings()
      .then((value) => active && setPreferences(value))
      .catch(() => undefined);

    getSecurityPolicy()
      .then((value) => active && setPolicy(value))
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  async function changePreference(patch: Partial<NotificationSettings>) {
    if (!preferences) {
      return;
    }

    const previous = preferences;
    const next = { ...preferences, ...patch };

    setPreferences(next);
    setSaving(true);

    try {
      setPreferences(await updateNotificationSettings(next));
      showToast("Pengaturan notifikasi disimpan");
    } catch {
      setPreferences(previous);
      showToast("Pengaturan notifikasi gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function signOut(session: AccountSession) {
    const approved = await confirm({
      title: "Keluarkan perangkat ini?",
      message: `Sesi di ${describeSession(session)} akan diakhiri. Perangkat itu harus login ulang untuk memakai portal.`,
      confirmLabel: "Ya, Keluarkan",
      danger: true,
      icon: LogOut,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setRevoking(session.id);

    try {
      await revokeSession(session.id);
      setSessions(
        (value) => value?.filter((item) => item.id !== session.id) ?? null,
      );
      showToast("Perangkat berhasil dikeluarkan");
    } catch {
      showToast("Perangkat gagal dikeluarkan.", "error");
    } finally {
      setRevoking(null);
    }
  }

  async function signOutOthers() {
    const approved = await confirm({
      title: "Keluar dari semua perangkat lain?",
      message:
        "Semua sesi selain perangkat ini akan diakhiri. Anda tetap masuk di perangkat yang sedang dipakai.",
      confirmLabel: "Ya, Keluarkan Semua",
      danger: true,
      icon: LogOut,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setRevoking(OTHER_SESSIONS);

    try {
      const revoked = await revokeOtherSessions();
      setSessions((value) => value?.filter((item) => item.isCurrent) ?? null);
      showToast(`${revoked} perangkat lain berhasil dikeluarkan`);
    } catch {
      showToast("Perangkat lain gagal dikeluarkan.", "error");
    } finally {
      setRevoking(null);
    }
  }

  return {
    sessions,
    preferences,
    policy,
    saving,
    revoking,
    otherSessions:
      sessions?.filter((session) => !session.isCurrent).length ?? 0,
    changePreference,
    signOut,
    signOutOthers,
  };
}
