import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50",
    ghost: "bg-transparent text-ink hover:bg-brand-50 border border-[var(--color-line)]",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  }[variant];

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus:border-brand-500 focus:ring-brand-100 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus:border-brand-500 focus:ring-brand-100 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2",
        className
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-ink-soft mb-1 block text-sm font-medium">{children}</label>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "red";
}) {
  const styles = {
    neutral: "bg-[var(--color-muted)] text-ink-soft",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  }[tone];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles)}>
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="text-ink-soft flex items-center justify-center py-10">
      <div className="border-brand-100 border-t-brand-600 h-6 w-6 animate-spin rounded-full border-2" />
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-ink-soft border-b border-[var(--color-line)] text-xs tracking-wide uppercase">
          {head}
        </thead>
        <tbody className="divide-y divide-[var(--color-line)]">{children}</tbody>
      </table>
    </div>
  );
}
