// src/mobile/services/analytics.ts
import { api } from "./api";

// Tipo conforme o retorno da API de peak hours
export type PeakHourDto = {
  startTime: string;        // "08:00"
  endTime: string;          // "09:00"
  reservationsCount: number;
};

export async function getPeakHours(params: {
  year: number;
  month: number;
  spaceId?: string; // Ajustado para string (ObjectId do MongoDB)
}): Promise<PeakHourDto[]> {
  const { year, month, spaceId } = params;

  return api.get<PeakHourDto[]>("/analytics/peak-hours", {
    year,
    month,
    spaceId,
  });
}