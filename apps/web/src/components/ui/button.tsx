import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "md" | "sm" | "compact";

type ButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: "start" | "end";
  }
>;

const BASE_CLASS: Record<ButtonSize, string> = {
  md: "btn",
  sm: "ac-btn",
  compact: "sm-btn",
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "",
  ghost: "ghost",
  danger: "danger",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "end",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  const base = BASE_CLASS[size];
  const variantClass = VARIANT_CLASS[variant];
  const resolvedVariant =
    size === "md" && variantClass ? `btn-${variantClass}` : variantClass;

  const classes = [base, resolvedVariant, className].filter(Boolean).join(" ");
  const iconSize = size === "md" ? 18 : 15;
  const iconNode = icon ? <Icon icon={icon} size={iconSize} /> : null;

  return (
    <button type={type} className={classes} {...props}>
      {iconPosition === "start" ? iconNode : null}
      {children}
      {iconPosition === "end" ? iconNode : null}
    </button>
  );
}
