type SkeletonProps = Readonly<{
  width?: string;
  height?: string;
  rounded?: boolean;
}>;

export function Skeleton({
  width = "100%",
  height = "1rem",
  rounded = false,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton${rounded ? " skeleton-rounded" : ""}`}
      style={{
        width,
        height,
      }}
      aria-hidden="true"
    />
  );
}
