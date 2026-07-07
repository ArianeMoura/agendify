/** Formatadores de data/hora em pt-BR — fonte única para as telas. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}
