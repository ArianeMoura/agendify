"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Booking, Space } from "@/lib/types";
import { Card, Spinner } from "@/components/ui";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <p className="text-ink-soft text-sm">{label}</p>
      <p className="text-ink mt-1 text-3xl font-semibold">{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
  });

  if (spaces.isLoading || bookings.isLoading) return <Spinner />;

  const now = new Date().toISOString();
  const upcoming = (bookings.data ?? []).filter((b) => b.startDateTime > now).length;
  const available = (spaces.data ?? []).filter((s) => s.availability).length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Espaços" value={spaces.data?.length ?? 0} />
        <Stat label="Espaços disponíveis" value={available} />
        <Stat label="Reservas totais" value={bookings.data?.length ?? 0} />
        <Stat label="Reservas futuras" value={upcoming} />
      </div>
    </div>
  );
}
