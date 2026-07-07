"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Booking } from "@/lib/types";
import { useDisclosure } from "@/lib/hooks/useDisclosure";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { BookingFormDialog } from "./BookingFormDialog";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function BookingsPage() {
  const form = useDisclosure();
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
  });

  const rows = bookings.data ?? [];

  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Acompanhe e crie reservas de espaços."
        action={
          <Button onClick={form.onOpen}>
            <Plus className="size-4" aria-hidden />
            Nova reserva
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {bookings.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarCheck2}
            title="Nenhuma reserva"
            description="Crie a primeira reserva para um espaço."
            action={
              <Button onClick={form.onOpen}>
                <Plus className="size-4" aria-hidden />
                Nova reserva
              </Button>
            }
          />
        ) : (
          <Table
            caption="Lista de reservas"
            head={
              <tr>
                <Th>Espaço</Th>
                <Th>Início</Th>
                <Th>Fim</Th>
                <Th>Status</Th>
              </tr>
            }
          >
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                <Td className="font-medium">{b.space?.name ?? b.spaceId}</Td>
                <Td>{fmt(b.startDateTime)}</Td>
                <Td>{fmt(b.endDateTime)}</Td>
                <Td>
                  <Badge tone={b.status === "confirmed" ? "success" : "neutral"}>{b.status}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <BookingFormDialog open={form.open} onOpenChange={form.setOpen} />
    </div>
  );
}
