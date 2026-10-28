import type { LucideIcon } from "lucide-react";

type IconProps = Readonly<{
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

export function Icon({
  icon: LucideComponent,
  size = 20,
  strokeWidth = 1.75,
  className,
}: IconProps) {
  const classes = ["i", className].filter(Boolean).join(" ");

  return (
    <LucideComponent
      className={classes}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
    />
  );
}
