import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type IconButtonVariant = "plain" | "square" | "kebab";

type IconButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    icon: LucideIcon;
    variant?: IconButtonVariant;
    size?: number;
  }
>;

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  plain: "icon-btn",
  square: "icon-sq",
  kebab: "kebab",
};

export function IconButton({
  label,
  icon,
  variant = "plain",
  size = 18,
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon icon={icon} size={size} />
    </button>
  );
}
