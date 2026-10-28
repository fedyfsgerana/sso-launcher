import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";

type FieldProps = Readonly<{
  label: string;
  children: ReactNode;
  span?: boolean;
  error?: string;
  hint?: string;
}>;

function classNames(span: boolean, error?: string) {
  return ["fld", span ? "span2" : "", error ? "has-error" : ""]
    .filter(Boolean)
    .join(" ");
}

export function Field({
  label,
  children,
  span = false,
  error,
  hint,
}: FieldProps) {
  return (
    <label className={classNames(span, error)}>
      <span>{label}</span>
      {children}
      {error ? <em className="fld-msg">{error}</em> : null}
      {!error && hint ? <em className="fld-hint">{hint}</em> : null}
    </label>
  );
}

type SelectFieldProps = Readonly<{
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
  span?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  searchPlaceholder?: string;
}>;

export function SelectField({
  label,
  value,
  options,
  onChange,
  span = false,
  disabled = false,
  error,
  hint,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari pilihan",
}: SelectFieldProps) {
  return (
    <div className={classNames(span, error)}>
      <span>{label}</span>
      <TomSelect
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
      />
      {error ? <em className="fld-msg">{error}</em> : null}
      {!error && hint ? <em className="fld-hint">{hint}</em> : null}
    </div>
  );
}

type FormSectionProps = Readonly<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}>;

export function FormSection({
  title,
  description,
  icon,
  children,
}: FormSectionProps) {
  const heading = (
    <>
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
    </>
  );

  return (
    <section className="fs">
      {icon ? (
        <div className="fs-head fs-head-ic is-compact">
          <i className="ch-ic ch-ic-sm">
            <Icon icon={icon} size={16} />
          </i>
          <div>{heading}</div>
        </div>
      ) : (
        <div className="fs-head">{heading}</div>
      )}

      <div className="fs-grid">{children}</div>
    </section>
  );
}
