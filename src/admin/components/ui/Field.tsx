import { ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
}

interface FieldProps {
  label: string;
  /** Texto de ajuda opcional (associado via aria-describedby). */
  hint?: string;
  /** Mensagem de erro; quando presente, marca o controle como inválido. */
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Render-prop: recebe id/aria-* já calculados para o controle. */
  children: (props: FieldControlProps) => ReactNode;
}

/**
 * Campo de formulário acessível (WCAG 1.3.1 / 3.3.1). Gera o id, associa o
 * <label> ao controle e vincula ajuda/erro por aria-describedby, marcando
 * aria-invalid quando há erro. O erro é anunciado por leitores de tela (role=alert).
 */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
