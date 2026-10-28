"use client";

type SearchInputProps = Readonly<{
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}>;

export function SearchInput({
  value,
  placeholder = "Cari",
  onChange,
}: SearchInputProps) {
  return (
    <div className="search-input">
      <span className="search-input-icon" aria-hidden="true">
        ⌕
      </span>

      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}
