import { cn } from "@/lib/utils/cn";
import { AgendifyIcon } from "./AgendifyIcon";
import { Wordmark } from "./Wordmark";

interface LogoProps {
  /** horizontal: ícone + wordmark lado a lado · vertical: empilhado (splash/login) */
  orientation?: "horizontal" | "vertical";
  /** Variante do ícone — no escuro, prefira "dark". */
  iconVariant?: "brand" | "dark" | "mono";
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
}

/**
 * Trava (lockup) da marca — ícone + wordmark. Usa componentes de marca puros,
 * então herda tema e escala por classes utilitárias.
 */
export function Logo({
  orientation = "horizontal",
  iconVariant = "brand",
  className,
  iconClassName,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        orientation === "horizontal" ? "gap-2.5" : "flex-col gap-3",
        className
      )}
    >
      <AgendifyIcon variant={iconVariant} className={cn("h-9 w-9", iconClassName)} />
      <Wordmark className={wordmarkClassName} />
    </span>
  );
}
