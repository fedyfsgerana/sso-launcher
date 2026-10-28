type AvatarProps = Readonly<{
  name: string;
  size?: "small" | "medium" | "large";
}>;

export function Avatar({ name, size = "medium" }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className={`avatar avatar-${size}`} aria-label={name}>
      {initials}
    </span>
  );
}
