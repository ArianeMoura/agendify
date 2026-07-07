"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PeakHour, Space } from "@/lib/types";
import {
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Table,
  TableSkeleton,
  Td,
  Th,
} from "@/components/ui";

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

  const rows = peaks.data ?? [];
  const max = Math.max(1, ...rows.map((p) => p.reservationsCount));

  return (
    <div>
      <PageHeader title="Relatórios de ocupação" description="Horários de pico por espaço." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Field label="Ano" className="w-28">
          {(p) => (
            <Input
              {...p}
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          )}
        </Field>
        <Field label="Mês" className="w-24">
          {(p) => (
            <Input
              {...p}
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          )}
        </Field>
      </div>

      <Card className="overflow-hidden">
        {peaks.isLoading ? (
          <TableSkeleton rowClassName="h-10" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Sem dados para o período"
            description="Ajuste o mês e o ano ou registre reservas para gerar o relatório."
          />
        ) : (
          <Table
            caption="Horários de pico por espaço"
            head={
              <tr>
                <Th>Espaço</Th>
                <Th>Horário de pico</Th>
                <Th className="w-1/2">Reservas</Th>
              </tr>
            }
          >
            {rows.map((p, i) => (
              <tr key={`${p.spaceId}-${p.hour}-${i}`}>
                <Td className="font-medium">{spaceName(p.spaceId)}</Td>
                <Td>{String(p.hour).padStart(2, "0")}:00</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div
                      className="bg-brand h-2 rounded-full"
                      style={{
                        width: `${(p.reservationsCount / max) * 100}%`,
                        minWidth: "8px",
                      }}
                    />
                    <span className="text-ink-muted">{p.reservationsCount}</span>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
