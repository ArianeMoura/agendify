/** Formatadores de data/hora em pt-BR — fonte única para as telas. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

/**
 * Hora de parede do <input type="datetime-local"> -> instante UTC para a API.
 *
 * Converte de verdade. Grudar um "Z" no fim afirmava que 14:00 em São Paulo era 14:00 UTC
 * e gravava a reserva 3h adiantada: a API só normaliza o Kind (SpecifyKind), nunca o
 * offset — quem converte é o cliente. new Date("YYYY-MM-DDTHH:mm") interpreta no fuso
 * local (spec do ECMAScript para a forma date-time sem offset), que é o que o input quis
 * dizer.
 */
export function toUtcIso(local: string): string {
  if (!local) return local;
  return new Date(local).toISOString();
}

/**
 * Inverso do toUtcIso: instante UTC da API -> hora de parede local no formato que o
 * datetime-local aceita (YYYY-MM-DDTHH:mm). Fatiar a string ignorava o fuso e reexibia o
 * horário errado — e, de brinde, o round-trip batia consigo mesmo e escondia o bug.
 */
export function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
