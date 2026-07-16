import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

interface ErrorStateProps {
  /** Mensagem técnica da falha (ex.: ApiError.message). */
  description?: string;
  title?: string;
  /** Sem isto o usuário só pode recarregar a página inteira. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Falha de carregamento. Existe porque as listas só tratavam isLoading e length === 0:
 * uma query que falhava caía no EmptyState e a tela afirmava "Nenhuma reserva" — o
 * operador lia "não há dados" onde a verdade era "não deu para saber".
 */
export function ErrorState({
  title = "Não foi possível carregar",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}
    >
      <span className="bg-danger/10 text-danger mb-4 inline-flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" />
      </span>
      <p className="font-display text-ink text-base font-semibold">{title}</p>
      {description && <p className="text-ink-muted mt-1 max-w-sm text-sm">{description}</p>}
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
