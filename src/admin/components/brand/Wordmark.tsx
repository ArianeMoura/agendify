import { cn } from "@/lib/utils/cn";

interface WordmarkProps {
  className?: string;
  /** Assinatura: "agendify" minúsculo + ponto âmbar (Sora ExtraBold). */
  as?: "span" | "div";
}

/**
 * Wordmark da marca — "agendify." em Sora ExtraBold (800), minúsculas, com o
 * ponto âmbar ("reserva feita, ponto final"). A cor do texto acompanha o tema
 * (text-ink); o ponto é sempre âmbar.
 */
export function Wordmark({ className, as: Tag = "span" }: WordmarkProps) {
  return (
    <Tag
      className={cn(
        "font-display text-ink text-2xl font-extrabold tracking-[-0.02em] lowercase select-none",
        className
      )}
    >
      agendify<span className="text-action">.</span>
    </Tag>
  );
}
