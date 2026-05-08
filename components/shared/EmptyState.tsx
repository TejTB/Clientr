import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
      style={{ paddingTop: 48, paddingBottom: 48 }}
    >
      {icon && (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-medium text-text">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
