"use client";

import { Bell, ShieldCheck } from "lucide-react";
import { SettingsCard } from "@/components/portal/settings/settings-card";
import { SettingsSwitch } from "@/components/portal/settings/settings-switch";
import { BlockSkeleton } from "@/components/portal/skeleton";
import type { NotificationSettings } from "@/features/account/api";
import styles from "./settings.module.css";
import { Badge } from "@/components/ui/status-badge";

type NotificationCardProps = Readonly<{
  preferences: NotificationSettings | null;
  saving: boolean;
  onChange: (patch: Partial<NotificationSettings>) => void;
}>;

type OptionKey = keyof NotificationSettings;

function patchOf(key: OptionKey, checked: boolean) {
  const patch: Partial<NotificationSettings> = {};

  patch[key] = checked;

  return patch;
}

const OPTIONS: ReadonlyArray<{
  key: OptionKey;
  title: string;
  description: string;
}> = [
  {
    key: "accessChanges",
    title: "Perubahan akses aplikasi",
    description: "Saat Anda mendapat atau kehilangan akses ke sebuah aplikasi.",
  },
  {
    key: "applicationStatus",
    title: "Status aplikasi",
    description: "Saat aplikasi Anda masuk atau selesai maintenance.",
  },
];

export function NotificationCard({
  preferences,
  saving,
  onChange,
}: NotificationCardProps) {
  return (
    <SettingsCard
      tone="app-fn"
      title="Notifikasi"
      icon={Bell}
      subtitle="Pilih pemberitahuan yang ingin Anda terima"
    >
      {preferences === null ? (
        <BlockSkeleton lines={4} />
      ) : (
        <div className={styles.options}>
          {OPTIONS.map((option) => (
            <div key={option.key} className={styles.option}>
              <div>
                <b>{option.title}</b>
                <small>{option.description}</small>
              </div>
              <SettingsSwitch
                checked={preferences[option.key]}
                label={option.title}
                disabled={saving}
                onChange={(checked) => onChange(patchOf(option.key, checked))}
              />
            </div>
          ))}

          <div className={styles.option}>
            <div>
              <b>Keamanan akun</b>
              <small>
                Login dari perangkat baru, password direset, dan akun dikunci.
                Selalu dikirim untuk melindungi akun Anda.
              </small>
            </div>
            <Badge tone="on" icon={ShieldCheck}>
              Selalu aktif
            </Badge>
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
