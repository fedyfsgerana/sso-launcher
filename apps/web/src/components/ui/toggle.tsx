"use client";

type ToggleProps = Readonly<{
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}>;

export function Toggle({
  checked,
  label,
  disabled = false,
  onChange,
}: ToggleProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />

      <span className="toggle-control" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>

      <span className="sr-only">{label}</span>
    </label>
  );
}
