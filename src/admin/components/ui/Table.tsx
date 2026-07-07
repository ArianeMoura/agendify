import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface TableProps {
  head: ReactNode;
  children: ReactNode;
  /** Legenda acessível (WCAG): descreve o conteúdo da tabela p/ leitores de tela. */
  caption?: string;
  className?: string;
}

export function Table({ head, children, caption, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="border-line text-ink-muted border-b text-xs font-medium tracking-wide uppercase">
          {head}
        </thead>
        <tbody className="divide-line divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("px-4 py-3 font-medium", className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("text-ink px-4 py-3", className)} {...props} />;
}
