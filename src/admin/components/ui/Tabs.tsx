"use client";

import { ComponentPropsWithoutRef } from "react";
import * as Radix from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils/cn";

/** Abas acessíveis (Radix): setas do teclado, roles e foco prontos. */
export const Tabs = Radix.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof Radix.List>) {
  return (
    <Radix.List className={cn("border-line inline-flex gap-1 border-b", className)} {...props} />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Trigger>) {
  return (
    <Radix.Trigger
      className={cn(
        "text-ink-muted -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium",
        "hover:text-ink data-[state=active]:border-brand data-[state=active]:text-brand-fg",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Radix.Content>) {
  return <Radix.Content className={cn("pt-4 focus:outline-none", className)} {...props} />;
}
