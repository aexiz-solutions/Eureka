import type { HTMLAttributes } from "react";

const baseClasses = "rounded-lg border border-gray-200 bg-white p-6 shadow-sm";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  const classes = `${baseClasses} ${className}`.trim();
  return <div className={classes} {...props} />;
}

export function StatCard({ className = "", ...props }: CardProps) {
  const classes = `${baseClasses} p-5 ${className}`.trim();
  return <div className={classes} {...props} />;
}
