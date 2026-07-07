import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Ação primária alinhada à direita (ex.: botão "Novo"). */
  action?: ReactNode;
}

/** Cabeçalho de página padronizado — título (Sora), descrição e ação. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-display text-ink text-2xl font-bold">{title}</h1>
        {description && <p className="text-ink-muted text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
