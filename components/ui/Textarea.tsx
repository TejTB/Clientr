"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg bg-surface px-4 py-3 text-[14px] text-text placeholder:text-muted resize-none",
          "border border-border focus:border-[rgba(99,102,241,0.4)] outline-none transition-colors",
          className
        )}
        {...rest}
      />
    );
  }
);
