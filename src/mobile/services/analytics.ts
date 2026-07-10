// Usa o cliente axios único (lib/api/config) — com Authorization e Base URL por env.
import { api } from '../lib/api/config';

export type PeakHourDto = {
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  reservationsCount: number;
};

export async function getPeakHours(params: {
  year: number;
  month: number;
  spaceId?: string;
}): Promise<PeakHourDto[]> {
  const { year, month, spaceId } = params;

  const response = await api.get<PeakHourDto[]>('/analytics/peak-hours', {
    params: { year, month, spaceId },
  });
  return response.data;
}
