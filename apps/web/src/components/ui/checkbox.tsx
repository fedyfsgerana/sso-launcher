import type { InputHTMLAttributes } from "react";

type CheckboxProps = Readonly<
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label: string;
    description?: string;
  }
>;

export function Checkbox({ label, description, id, ...props }: CheckboxProps) {
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" {...props} />

      <span className="checkbox-control" aria-hidden="true" />

      <span className="checkbox-content">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}
