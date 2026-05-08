"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg bg-surface px-4 text-[14px] text-text placeholder:text-muted",
          "border border-border focus:border-[rgba(99,102,241,0.4)] outline-none transition-colors",
          className
        )}
        {...rest}
      />
    );
  }
);
