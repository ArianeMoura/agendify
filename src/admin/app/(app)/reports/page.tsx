"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PeakHour, Space } from "@/lib/types";
import { Card, Input, Label, Spinner, Table } from "@/components/ui";

const nowRef = new Date();

export default function ReportsPage() {
  const [year, setYear] = useState(nowRef.getUTCFullYear());
  const [month, setMonth] = useState(nowRef.getUTCMonth() + 1);

  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });
  const peaks = useQuery({
    queryKey: ["peak-hours", year, month],
    queryFn: () => apiFetch<PeakHour[]>(`/analytics/peak-hours?year=${year}&month=${month}`),
  });

  const spaceName = useMemo(() => {
    const map = new Map((spaces.data ?? []).map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? id;
  }, [spaces.data]);

  const max = Math.max(1, ...(peaks.data ?? []).map((p) => p.reservationsCount));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Relatórios de ocupação</h1>

      <div className="mb-4 flex gap-3">
        <div>
          <Label>Ano</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" />
        </div>
        <div>
          <Label>Mês</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <Card className="p-0">
        {peaks.isLoading ? (
          <Spinner />
        ) : (
          <Table
            head={
              <tr>
                <th className="px-4 py-3">Espaço</th>
                <th className="px-4 py-3">Horário de pico</th>
                <th className="px-4 py-3 w-1/2">Reservas</th>
              </tr>
            }
          >
            {(peaks.data ?? []).map((p, i) => (
              <tr key={`${p.spaceId}-${p.hour}-${i}`}>
                <td className="px-4 py-3 font-medium">{spaceName(p.spaceId)}</td>
                <td className="px-4 py-3">{String(p.hour).padStart(2, "0")}:00</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${(p.reservationsCount / max) * 100}%`, minWidth: "8px" }}
                    />
                    <span className="text-ink-soft">{p.reservationsCount}</span>
                  </div>
                </td>
              </tr>
            ))}
            {(peaks.data ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-soft">
                  Sem dados para o período.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
}
