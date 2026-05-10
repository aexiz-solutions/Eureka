import type { HTMLAttributes } from "react";

const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

const variantClasses = {
  green: "bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]",
  yellow: "bg-[var(--color-status-yellow-bg)] text-[var(--color-status-yellow-text)]",
  red: "bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]",
  blue: "bg-[var(--color-blue-100)] text-[var(--color-blue-800)]",
  neutral: "bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]",
} as const;

type BadgeVariant = keyof typeof variantClasses;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ variant = "blue", className = "", ...props }: BadgeProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  return <span className={classes} {...props} />;
}
