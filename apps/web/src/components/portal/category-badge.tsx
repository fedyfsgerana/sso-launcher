import { Tag } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type CategoryBadgeProps = Readonly<{
  label: string;
  warn?: boolean;
}>;

export function CategoryBadge({ label, warn = false }: CategoryBadgeProps) {
  return (
    <span className={warn ? "ac-cat warn" : "ac-cat"} title={label}>
      <Icon icon={Tag} size={12} />
      <span>{label}</span>
    </span>
  );
}
