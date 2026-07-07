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
            "border-line bg-surface rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)]",
            "max-h-[calc(100vh-2rem)] overflow-y-auto focus:outline-none",
            className
          )}
        >
          <div className="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="space-y-1">
              <RadixDialog.Title className="font-display text-ink text-lg font-semibold">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-ink-muted text-sm">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              className="text-ink-muted hover:bg-surface-muted hover:text-ink rounded-[var(--radius-sm)] p-1"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden />
            </RadixDialog.Close>
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="border-line flex justify-end gap-2 border-t px-5 py-4">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
