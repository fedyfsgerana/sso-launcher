"use client";

import styles from "./settings.module.css";

type SettingsSwitchProps = Readonly<{
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}>;

export function SettingsSwitch({
  checked,
  label,
  disabled = false,
  onChange,
}: SettingsSwitchProps) {
  return (
    <button
      className={styles.switch}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}
