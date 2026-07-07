"use client";

import { ComponentPropsWithoutRef } from "react";
import * as Radix from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";

/** Menu suspenso acessível (Radix): teclado, foco e ARIA prontos. */
export const DropdownMenu = Radix.Root;
export const DropdownMenuTrigger = Radix.Trigger;

export function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Content>) {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "border-line bg-surface z-50 min-w-44 rounded-[var(--radius-md)] border p-1 shadow-[var(--shadow-md)]",
          "focus:outline-none",
          className
        )}
        {...props}
      />
    </Radix.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Item>) {
  return (
    <Radix.Item
      className={cn(
        "text-ink flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm outline-none",
        "data-[highlighted]:bg-surface-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Label>) {
  return <Radix.Label className={cn("text-ink-muted px-3 py-1.5 text-xs", className)} {...props} />;
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Separator>) {
  return <Radix.Separator className={cn("bg-line my-1 h-px", className)} {...props} />;
}
