import type { HTMLAttributes } from "react";

const baseClasses = "rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-sm";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  const classes = `${baseClasses} ${className}`.trim();
  return <div className={classes} {...props} />;
}

export function StatCard({ className = "", ...props }: CardProps) {
  const classes = `${baseClasses} ${className}`.trim();
  return <div className={classes} {...props} />;
}
