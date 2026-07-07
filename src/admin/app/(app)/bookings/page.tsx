"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Booking } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/date";
import { useDisclosure } from "@/lib/hooks/useDisclosure";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Table,
  TableSkeleton,
  Td,
  Th,
} from "@/components/ui";
import { BookingFormDialog } from "./BookingFormDialog";

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
          <TableSkeleton />
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
                <Td>{formatDateTime(b.startDateTime)}</Td>
                <Td>{formatDateTime(b.endDateTime)}</Td>
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
