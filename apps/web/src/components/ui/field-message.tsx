type FieldMessageProps = Readonly<{
  children: string;
  type?: "description" | "error";
}>;

export function FieldMessage({
  children,
  type = "description",
}: FieldMessageProps) {
  return (
    <span
      className={`field-message field-message-${type}`}
      role={type === "error" ? "alert" : undefined}
    >
      {children}
    </span>
  );
}
