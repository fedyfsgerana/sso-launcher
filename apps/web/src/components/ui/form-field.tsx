import type { ReactNode } from "react";

type FormFieldProps = Readonly<{
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  children: ReactNode;
}>;

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor} className="form-field-label">
        {label}
      </label>

      {description && (
        <span className="form-field-description">{description}</span>
      )}

      {children}

      {error && (
        <span className="form-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
