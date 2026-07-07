import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Placeholder de carregamento. aria-hidden: é decorativo (use um status à parte). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("bg-surface-muted animate-pulse rounded-[var(--radius-sm)]", className)}
      {...props}
    />
  );
}
