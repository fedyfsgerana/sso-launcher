"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export type TomSelectOption = Readonly<{
  value: string;
  label: string;
}>;

type TomSelectProps = Readonly<{
  value: string;
  options: ReadonlyArray<TomSelectOption>;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "filter";
}>;

type DropdownPosition = Readonly<{
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
}>;

export function TomSelect({
  value,
  options,
  onChange,
  id,
  ariaLabel,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari pilihan",
  emptyText = "Tidak ada pilihan",
  disabled = false,
  className,
  variant = "default",
}: TomSelectProps) {
  const generatedId = useId();
  const controlId = id ?? `tom-select-${generatedId.replace(/:/g, "")}`;
  const listboxId = `${controlId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");

    if (!keyword) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLocaleLowerCase("id-ID").includes(keyword),
    );
  }, [options, query]);

  function updatePosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 6;
    const width = Math.max(rect.width, 220);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
    const spaceAbove = rect.top - viewportPadding - gap;
    const above = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      160,
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
        : {
            top: rect.bottom + gap,
            left,
            width,
            maxHeight,
            above,
          },
    );
  }

  function closeDropdown() {
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);
  }

  function openDropdown() {
    if (disabled) {
      return;
    }

    updatePosition();
    setOpen(true);
  }

  function selectValue(nextValue: string) {
    onChange(nextValue);
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
      setHighlightedIndex((current) =>
        Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredOptions[highlightedIndex]) {
      event.preventDefault();
      selectValue(filteredOptions[highlightedIndex].value);
    }
  }

  const classes = [
    "ts-control",
    variant === "filter" ? "filter" : "",
    open ? "open" : "",
    selectedOption ? "" : "is-placeholder",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        ref={buttonRef}
        id={controlId}
        type="button"
        className={classes}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
      >
        <span className="ts-val">{selectedOption?.label ?? placeholder}</span>
        <Icon icon={ChevronDown} size={16} />
      </button>

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
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlightedIndex(0);
                  }}
                />
              </div>

              <ul id={listboxId} className="ts-list" role="listbox">
                {filteredOptions.length === 0 ? (
                  <li className="ts-empty">{emptyText}</li>
                ) : (
                  filteredOptions.map((option, index) => {
                    const selected = option.value === value;
                    const highlighted = index === highlightedIndex;

                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={selected}
                        className={[
                          selected ? "sel" : "",
                          highlighted ? "hi" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectValue(option.value)}
                      >
                        <span>{option.label}</span>
                        {selected ? <Icon icon={Check} size={15} /> : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
