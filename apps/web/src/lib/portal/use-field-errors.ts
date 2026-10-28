import { useEffect, useRef, useState } from "react";

type Errors = Record<string, string | undefined>;

const FOCUSABLE =
  'input:not([type="hidden"]):not([readonly]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusFirstError() {
  const field = document.querySelector<HTMLElement>(".fld.has-error");

  if (!field) {
    return;
  }

  field.scrollIntoView({ behavior: "smooth", block: "center" });
  field.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
}

export function useFieldErrors<TForm>(
  form: TForm,
  rules: (value: TForm) => Errors,
) {
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const focusPending = useRef(false);

  useEffect(() => {
    if (!focusPending.current) {
      return;
    }

    focusPending.current = false;

    const frame = requestAnimationFrame(focusFirstError);

    return () => cancelAnimationFrame(frame);
  }, [errors]);

  function checkField(field: string) {
    const result = rules(form);

    setErrors((value) => ({ ...value, [field]: result[field] }));
  }

  function clearField(field: string) {
    if (!errors[field]) {
      return;
    }

    const next = { ...errors, [field]: undefined };

    if (!Object.values(next).some(Boolean)) {
      setSubmitted(false);
    }

    setErrors(next);
  }

  function checkAll() {
    const result = rules(form);

    focusPending.current = Object.values(result).some(Boolean);
    setSubmitted(focusPending.current);
    setErrors(result);

    return result;
  }

  const errorSummary = submitted
    ? Object.values(errors).filter(Boolean).length
    : 0;

  return { errors, errorSummary, setErrors, checkField, clearField, checkAll };
}
