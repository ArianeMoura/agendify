import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos de utilitárias
 * Tailwind (tailwind-merge) — ex.: cn("px-2", cond && "px-4") → "px-4".
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
