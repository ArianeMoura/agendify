import { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Ação primária (ex.: botão "Novo espaço"). */
  action?: ReactNode;
  className?: string;
}

/** Estado vazio consistente — ícone, título, descrição e ação opcional. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}
    >
      <span className="bg-brand-50 text-brand mb-4 inline-flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </span>
      <p className="font-display text-ink text-base font-semibold">{title}</p>
      {description && <p className="text-ink-muted mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
