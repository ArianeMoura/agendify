import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "alert";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-ink-muted",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-action/20 text-on-action",
  danger: "bg-danger/10 text-danger",
  alert: "bg-[var(--color-alert-soft)] text-[color-mix(in_srgb,var(--color-alert)_75%,#000)]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
