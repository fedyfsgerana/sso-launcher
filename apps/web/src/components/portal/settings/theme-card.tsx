"use client";

import { Monitor, Moon, Palette, Sun, type LucideIcon } from "lucide-react";
import {
  useTheme,
  type ThemePreference,
} from "@/components/layout/theme-provider";
import { SettingsCard } from "@/components/portal/settings/settings-card";
import { Icon } from "@/components/ui/icon";
import styles from "./settings.module.css";

const THEMES: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Ikuti Sistem", icon: Monitor },
];

function ThemeMock({ mode }: Readonly<{ mode: "light" | "dark" }>) {
  return (
    <span
      className={
        mode === "dark" ? `${styles.mock} ${styles.mockDark}` : styles.mock
      }
    >
      <span className={styles.mockSide}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.mockMain}>
        <i className={styles.mockBar} />
        <span className={styles.mockCards}>
          <i />
          <i />
        </span>
        <i className={styles.mockRow} />
      </span>
    </span>
  );
}

export function ThemeCard() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsCard
      tone="app-pj"
      title="Tampilan"
      icon={Palette}
      subtitle="Tema warna portal di perangkat ini"
    >
      <div className={styles.themes} role="radiogroup" aria-label="Tema">
        {THEMES.map((item) => (
          <button
            key={item.value}
            className={styles.theme}
            type="button"
            role="radio"
            aria-checked={theme === item.value}
            onClick={() => setTheme(item.value)}
          >
            <span className={styles.preview} aria-hidden="true">
              {item.value === "system" ? (
                <>
                  <ThemeMock mode="light" />
                  <ThemeMock mode="dark" />
                </>
              ) : (
                <ThemeMock mode={item.value} />
              )}
            </span>
            <span className={styles.themeLabel}>
              <Icon icon={item.icon} size={16} />
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </SettingsCard>
  );
}
