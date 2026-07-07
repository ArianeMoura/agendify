"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarCheck2, CalendarClock, MapPin, type LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Booking, Space } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/date";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Skeleton,
  TableSkeleton,
} from "@/components/ui";

function StatCard({
  label,
  value,
  Icon,
  loading,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  loading: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-ink-muted text-sm">{label}</p>
        <span className="bg-brand-50 text-brand inline-flex size-9 items-center justify-center rounded-[var(--radius-md)]">
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-16" />
      ) : (
        <p className="font-display text-ink mt-1 text-3xl font-bold">{value}</p>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
  });

  const loading = spaces.isLoading || bookings.isLoading;
  const now = new Date().toISOString();
  const allBookings = bookings.data ?? [];
  const upcoming = allBookings.filter((b) => b.startDateTime > now).length;
  const available = (spaces.data ?? []).filter((s) => s.availability).length;

  const recent = [...allBookings]
    .sort((a, b) => b.startDateTime.localeCompare(a.startDateTime))
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Visão geral" description="Resumo dos espaços e reservas." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Espaços"
          value={spaces.data?.length ?? 0}
          Icon={MapPin}
          loading={loading}
        />
        <StatCard label="Disponíveis" value={available} Icon={BarChart3} loading={loading} />
        <StatCard
          label="Reservas totais"
          value={allBookings.length}
          Icon={CalendarCheck2}
          loading={loading}
        />
        <StatCard
          label="Reservas futuras"
          value={upcoming}
          Icon={CalendarClock}
          loading={loading}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reservas recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={CalendarCheck2}
              title="Nenhuma reserva ainda"
              description="As reservas criadas aparecerão aqui."
            />
          ) : (
            <ul className="divide-line divide-y">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm font-medium">
                      {b.space?.name ?? b.spaceId}
                    </p>
                    <p className="text-ink-muted text-xs">{formatDateTime(b.startDateTime)}</p>
                  </div>
                  <Badge tone={b.status === "confirmed" ? "success" : "neutral"}>{b.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
