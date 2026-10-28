type SpinnerProps = Readonly<{
  size?: number;
  className?: string;
}>;

export function Spinner({ size = 16, className }: SpinnerProps) {
  const classes = ["spinner", className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
