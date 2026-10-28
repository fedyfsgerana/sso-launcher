type DividerProps = Readonly<{
  orientation?: "horizontal" | "vertical";
}>;

export function Divider({ orientation = "horizontal" }: DividerProps) {
  return (
    <div
      className={`divider divider-${orientation}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
}
