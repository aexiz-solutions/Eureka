import type { HTMLAttributes } from "react";

const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const variantClasses = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-600",
} as const;

type BadgeVariant = keyof typeof variantClasses;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ variant = "blue", className = "", ...props }: BadgeProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  return <span className={classes} {...props} />;
}
