"use client";

import { ReactNode } from "react";
import * as Radix from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/** Tooltip acessível (Radix). Envolva a app uma vez com <TooltipProvider>. */
export const TooltipProvider = Radix.Provider;

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <Radix.Root>
      <Radix.Trigger asChild>{children}</Radix.Trigger>
      <Radix.Portal>
        <Radix.Content
          side={side}
          sideOffset={6}
          className={cn(
            "bg-ink text-surface z-50 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium shadow-[var(--shadow-md)]",
            className
          )}
        >
          {content}
          <Radix.Arrow className="fill-ink" />
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  );
}
