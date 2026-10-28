"use client";

import { useMemo, useState } from "react";
import { Ban, Search, SearchX } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { Icon } from "@/components/ui/icon";
import { ICON_KEYS, ICON_LIBRARY, iconLabel } from "@/lib/icons";
import styles from "./icon-picker.module.css";

type IconPickerProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}>;

export function IconPicker({ label, value, onChange, hint }: IconPickerProps) {
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return ICON_KEYS;
    }

    return ICON_KEYS.filter((key) =>
      `${key} ${ICON_LIBRARY[key].label}`.toLowerCase().includes(keyword),
    );
  }, [query]);

  return (
    <div className="span2 fld">
      <span>{label}</span>

      <div className={styles.box}>
        <div className={styles.bar}>
          <span className={styles.current}>
            {value ? (
              <>
                <Icon
                  icon={ICON_LIBRARY[value]?.icon ?? ICON_LIBRARY.apps.icon}
                  size={18}
                />
                {iconLabel(value)}
              </>
            ) : (
              <>
                <Icon icon={Ban} size={18} />
                Tanpa ikon
              </>
            )}
          </span>

          <label className={`search ${styles.search}`}>
            <Icon icon={Search} size={16} />
            <input
              placeholder="Cari ikon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div
          className={
            options.length === 0
              ? `${styles.grid} ${styles.gridEmpty}`
              : styles.grid
          }
          role="group"
          aria-label={label}
        >
          {query.trim() ? null : (
            <button
              type="button"
              className={
                value === "" ? `${styles.none} ${styles.on}` : styles.none
              }
              aria-pressed={value === ""}
              title="Tanpa ikon"
              onClick={() => onChange("")}
            >
              <Icon icon={Ban} size={18} />
              <em>Tanpa ikon</em>
            </button>
          )}

          {options.length === 0 ? (
            <EmptyState
              badge={SearchX}
              title="Ikon tidak ditemukan"
              description="Coba kata kunci lain, misalnya gudang atau laporan."
              inPanel
            />
          ) : (
            [...options].map((key) => (
              <button
                key={key}
                type="button"
                className={key === value ? styles.on : undefined}
                aria-pressed={key === value}
                title={ICON_LIBRARY[key].label}
                onClick={() => onChange(key)}
              >
                <Icon icon={ICON_LIBRARY[key].icon} size={18} />
                <em>{ICON_LIBRARY[key].label}</em>
              </button>
            ))
          )}
        </div>
      </div>

      {hint ? <em className="fld-hint">{hint}</em> : null}
    </div>
  );
}
