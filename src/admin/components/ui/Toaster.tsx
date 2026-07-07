"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/**
 * Toasts (sonner) — acessível (região aria-live) e alinhado ao tema. O tom de voz
 * da marca: mensagem direta, verbo de estado no início, sempre com próxima ação.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--radius-md)] !border-line !bg-surface !text-ink !shadow-[var(--shadow-md)] font-sans",
          description: "!text-ink-muted",
        },
      }}
    />
  );
}

export { toast } from "sonner";
