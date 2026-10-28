type FormErrorSummaryProps = Readonly<{
  count: number;
  className?: string;
}>;

export function FormErrorSummary({ count, className }: FormErrorSummaryProps) {
  if (count < 2) {
    return null;
  }

  return (
    <p
      className={["note-box danger form-summary", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <span>
        <b>{count} isian belum benar</b>
        Periksa kolom yang ditandai merah, lalu simpan lagi.
      </span>
    </p>
  );
}
