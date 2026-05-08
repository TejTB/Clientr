"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-gradient text-white font-semibold shadow-btn-primary hover:shadow-btn-primary-hover hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-btn-primary",
  secondary:
    "bg-surface text-text border border-border-strong hover:bg-surface-2 disabled:opacity-50",
  ghost:
    "bg-transparent text-text hover:bg-surface border border-transparent hover:border-border disabled:opacity-50",
  danger:
    "bg-transparent text-danger-fg border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-50"
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-5 text-[14px] rounded-md",
  lg: "h-12 px-6 text-[15px] rounded-md"
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    className,
    children,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 ease-smooth whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="flex gap-1">
          <span
            className="h-1 w-1 rounded-full bg-current opacity-30 animate-pulse-dot"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1 w-1 rounded-full bg-current opacity-30 animate-pulse-dot"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-1 w-1 rounded-full bg-current opacity-30 animate-pulse-dot"
            style={{ animationDelay: "400ms" }}
          />
        </span>
      ) : (
        children
      )}
    </button>
  );
});
