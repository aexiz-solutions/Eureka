import type { ButtonHTMLAttributes } from "react";

const baseClasses =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses = {
  primary: "bg-[var(--color-blue-600)] text-white hover:bg-[var(--color-blue-700)]",
  secondary:
    "border border-[var(--color-blue-600)] text-[var(--color-blue-600)] hover:bg-[var(--color-blue-100)]",
  ghost: "text-[var(--color-blue-600)] hover:text-[var(--color-blue-700)]",
} as const;

type ButtonVariant = keyof typeof variantClasses;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  return <button type={type} className={classes} {...props} />;
}
