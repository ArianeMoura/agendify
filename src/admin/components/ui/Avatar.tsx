"use client";

import * as Radix from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

/** Avatar com fallback de iniciais (Radix). */
export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <Radix.Root
      className={cn(
        "bg-brand-100 inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
        className
      )}
    >
      <Radix.Image src={src} alt={name} className="size-full object-cover" />
      <Radix.Fallback className="text-brand-700 text-sm font-semibold">
        {initials(name)}
      </Radix.Fallback>
    </Radix.Root>
  );
}
