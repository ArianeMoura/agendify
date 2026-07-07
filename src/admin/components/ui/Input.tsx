import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-[var(--radius-sm)] border border-line bg-surface text-ink " +
  "px-3 py-2 text-sm transition-colors placeholder:text-ink-muted " +
  "aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(fieldBase, "pr-8", className)} {...props} />;
  }
);
