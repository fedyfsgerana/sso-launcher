"use client";

import { NotificationCard } from "@/components/portal/settings/notification-card";
import { SecurityCard } from "@/components/portal/settings/security-card";
import { SessionCard } from "@/components/portal/settings/session-card";
import styles from "@/components/portal/settings/settings.module.css";
import { ThemeCard } from "@/components/portal/settings/theme-card";
import { PageHero } from "@/components/portal/page-hero";
import { useAccountSettings } from "@/features/account/use-account-settings";

export default function SettingsPage() {
  const settings = useAccountSettings();

  return (
    <div className="page">
      <PageHero
        title="Pengaturan"
        description="Atur tampilan, notifikasi, dan perangkat yang terhubung ke akun Anda."
      />

      <div className={styles.grid}>
        <div className={styles.column}>
          <ThemeCard />
          <NotificationCard
            preferences={settings.preferences}
            saving={settings.saving}
            onChange={(patch) => void settings.changePreference(patch)}
          />
        </div>

        <div className={styles.column}>
          <SessionCard
            sessions={settings.sessions}
            otherSessions={settings.otherSessions}
            revoking={settings.revoking}
            onSignOut={(session) => void settings.signOut(session)}
            onSignOutOthers={() => void settings.signOutOthers()}
          />
        </div>
      </div>

      <SecurityCard policy={settings.policy} />
    </div>
  );
}
