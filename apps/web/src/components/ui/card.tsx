import type { HTMLAttributes, ReactNode } from "react";

type CardProps = Readonly<
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  }
>;

export function Card({ children, className, ...props }: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
