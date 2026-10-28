"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import styles from "./password-input.module.css";

type PasswordInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  onBlur?: () => void;
}>;

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  invalid = false,
  onBlur,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />

      <button
        className={styles.eye}
        type="button"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        title={visible ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon icon={visible ? EyeOff : Eye} size={16} />
      </button>
    </div>
  );
}
