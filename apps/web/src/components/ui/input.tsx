import type { InputHTMLAttributes } from "react";

type InputProps = Readonly<
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
>;

export function Input({ label, error, id, className, ...props }: InputProps) {
  const classes = ["input", className].filter(Boolean).join(" ");

  return (
    <label className="input-field" htmlFor={id}>
      {label && <span className="input-label">{label}</span>}

      <input
        id={id}
        className={classes}
        aria-invalid={Boolean(error)}
        {...props}
      />

      {error && <span className="input-error">{error}</span>}
    </label>
  );
}
