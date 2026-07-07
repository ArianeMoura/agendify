"use client";

import { ComponentPropsWithoutRef } from "react";
import * as Radix from "@radix-ui/react-switch";
import { cn } from "@/lib/utils/cn";

/** Toggle acessível (Radix). Passe aria-label ou associe via <Field>. */
export function Switch({ className, ...props }: ComponentPropsWithoutRef<typeof Radix.Root>) {
  return (
    <Radix.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors",
        "bg-line data-[state=checked]:bg-brand",
        className
      )}
      {...props}
    >
      <Radix.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[1.375rem]" />
    </Radix.Root>
  );
}
