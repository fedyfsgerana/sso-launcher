"use client";

import { TomSelect, type TomSelectOption } from "@/components/ui/tom-select";

type SelectProps = Readonly<{
  label?: string;
  value: string;
  options: ReadonlyArray<TomSelectOption>;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}>;

export function Select({
  label,
  value,
  options,
  onChange,
  error,
  id,
  disabled = false,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari pilihan",
  className,
}: SelectProps) {
  return (
    <div className="select-field">
      {label ? <span className="select-label">{label}</span> : null}
      <TomSelect
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        className={className}
      />
      {error ? <span className="select-error">{error}</span> : null}
    </div>
  );
}
