import type { ButtonHTMLAttributes } from "react";

const baseClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses = {
  primary: "bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
  secondary: "border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50",
  ghost: "bg-transparent px-3 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800",
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
