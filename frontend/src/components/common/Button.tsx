import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "md" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm",
  secondary:
    "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-600 shadow-sm",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-alt",
  danger: "bg-error-500 text-white hover:bg-error-600 active:bg-error-600 shadow-sm",
  outline:
    "bg-transparent text-ink border border-line-strong hover:bg-surface-alt",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 min-h-[40px]",
  md: "text-base px-4 py-2.5 min-h-[44px]",
  lg: "text-base px-5 py-3.5 min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
