import type { TextareaHTMLAttributes } from "react";

type TextareaProps = Readonly<
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
  }
>;

export function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: TextareaProps) {
  const classes = ["textarea", className].filter(Boolean).join(" ");

  return (
    <label className="textarea-field" htmlFor={id}>
      {label && <span className="textarea-label">{label}</span>}

      <textarea
        id={id}
        className={classes}
        aria-invalid={Boolean(error)}
        {...props}
      />

      {error && (
        <span className="textarea-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
