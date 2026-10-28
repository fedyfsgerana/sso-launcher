"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseBusiness,
  ListFilter,
  PencilLine,
  Search,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import type { GroupNameOption } from "@/features/groups/api";
import pickerStyles from "./picker.module.css";
import styles from "./group-name-field.module.css";

type GroupNameFieldProps = Readonly<{
  label: string;
  value: string;
  error?: string;
  hint?: string;
  options: ReadonlyArray<GroupNameOption> | null;
  currentGroupId?: string;
  disabled?: boolean;
  manual: boolean;
  onManualChange: (manual: boolean) => void;
  onChange: (name: string) => void;
  onBlur: () => void;
}>;

type DropdownPosition = Readonly<{
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
}>;

export function GroupNameField({
  label,
  value,
  error,
  hint,
  options,
  currentGroupId,
  disabled = false,
  manual,
  onManualChange,
  onChange,
  onBlur,
}: GroupNameFieldProps) {
  const generatedId = useId();
  const listboxId = `group-name-field-${generatedId.replace(/:/g, "")}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const keyword = query.trim().toLocaleLowerCase("id-ID");
  const items = (options ?? []).filter((option) =>
    option.name.toLocaleLowerCase("id-ID").includes(keyword),
  );

  function isTaken(option: GroupNameOption) {
    return option.groupId !== null && option.groupId !== currentGroupId;
  }

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 6;
    const width = Math.max(rect.width, 260);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
    const spaceAbove = rect.top - viewportPadding - gap;
    const above = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      200,
      Math.min(360, above ? spaceAbove : spaceBelow),
    );

    setPosition(
      above
        ? {
            bottom: window.innerHeight - rect.top + gap,
            left,
            width,
            maxHeight,
            above,
          }
        : { top: rect.bottom + gap, left, width, maxHeight, above },
    );
  }

  function closeDropdown() {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  }

  function openDropdown() {
    if (disabled) {
      return;
    }

    updatePosition();
    setOpen(true);
  }

  function choose(option: GroupNameOption) {
    if (isTaken(option)) {
      return;
    }

    onChange(option.name);
    closeDropdown();
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    requestAnimationFrame(() => searchRef.current?.focus());

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      closeDropdown();
    };

    const handlePositionChange = () => updatePosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (
      !open &&
      (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
      requestAnimationFrame(() => buttonRef.current?.focus());
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((current) =>
        Math.min(current + 1, Math.max(items.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && items[highlighted]) {
      event.preventDefault();
      choose(items[highlighted]);
    }
  }

  function renderStatus() {
    if (options === null) {
      return (
        <li className={pickerStyles.note}>
          <Spinner size={16} />
        </li>
      );
    }

    if (items.length === 0) {
      return (
        <li className={pickerStyles.note}>
          {keyword
            ? "Jabatan tidak ditemukan"
            : "Belum ada jabatan pengguna di departemen ini"}
        </li>
      );
    }

    return null;
  }

  return (
    <div className={error ? "fld has-error" : "fld"}>
      <span>{label}</span>

      <div className={pickerStyles.row}>
        {manual ? (
          <input
            className={styles.input}
            value={value}
            placeholder="Masukkan nama grup"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={(event) => {
              if (event.relatedTarget !== toggleRef.current) {
                onBlur();
              }
            }}
          />
        ) : (
          <button
            ref={buttonRef}
            type="button"
            className={[
              "ts-control",
              value ? "" : "is-placeholder",
              pickerStyles.trigger,
              open ? "open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            disabled={disabled}
            onClick={() => (open ? closeDropdown() : openDropdown())}
            onKeyDown={handleKeyDown}
          >
            <span className="ts-val">
              {value || (disabled ? "Pilih departemen dulu" : "Pilih jabatan")}
            </span>
            <Icon icon={BriefcaseBusiness} size={16} />
          </button>
        )}

        {disabled ? null : (
          <button
            ref={toggleRef}
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              closeDropdown();
              onManualChange(!manual);
            }}
          >
            {manual ? "Pilih Jabatan" : "Isi Manual"}
            <Icon icon={manual ? ListFilter : PencilLine} size={18} />
          </button>
        )}
      </div>

      {error ? <em className="fld-msg">{error}</em> : null}
      {!error && hint ? <em className="fld-hint">{hint}</em> : null}

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              className={
                position.above ? "ts-dropdown is-above" : "ts-dropdown"
              }
              style={{
                top: position.top,
                bottom: position.bottom,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              onKeyDown={handleKeyDown}
            >
              <div className="ts-search">
                <Icon icon={Search} size={16} />
                <input
                  ref={searchRef}
                  value={query}
                  placeholder="Ketik jabatan"
                  aria-label="Cari jabatan"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlighted(0);
                  }}
                />
              </div>

              <ul id={listboxId} className="ts-list" role="listbox">
                {renderStatus() ??
                  items.map((option, index) => {
                    const taken = isTaken(option);
                    const classes = [
                      pickerStyles.item,
                      taken ? pickerStyles.taken : "",
                      index === highlighted ? "hi" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <li
                        key={option.name}
                        role="option"
                        aria-selected={option.name === value}
                        aria-disabled={taken || undefined}
                        className={classes}
                        onMouseEnter={() => setHighlighted(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(option)}
                      >
                        <span>{option.name}</span>
                        {taken ? <em>Sudah dipakai grup lain</em> : null}
                      </li>
                    );
                  })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
