import { cn } from "@/lib/utils/cn";

interface SpinnerProps {
  className?: string;
  /** Rótulo acessível anunciado por leitores de tela. */
  label?: string;
}

export function Spinner({ className, label = "Carregando" }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex items-center justify-center", className)}>
      <span className="size-6 animate-spin rounded-full border-2 border-brand-100 border-t-brand" />
      <span className="sr-only">{label}…</span>
    </span>
  );
}

/** Estado de carregamento centralizado para áreas de conteúdo. */
export function LoadingBlock({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner label={label} />
    </div>
  );
}
