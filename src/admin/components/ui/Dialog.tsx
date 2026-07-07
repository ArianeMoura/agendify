"use client";

import { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Modal acessível (Radix): foco preso, Esc fecha, ARIA de diálogo, título/descrição
 * associados. Estilizado com tokens da marca.
 */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Rodapé opcional (ações). */
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-lg)]",
            "max-h-[calc(100vh-2rem)] overflow-y-auto focus:outline-none",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="space-y-1">
              <RadixDialog.Title className="font-display text-lg font-semibold text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-sm text-ink-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="rounded-[var(--radius-sm)] p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden />
            </RadixDialog.Close>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
