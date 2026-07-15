"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Pencil, Plus } from "lucide-react";
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
  Tooltip,
} from "@/components/ui";
import { BookingFormDialog } from "./BookingFormDialog";

export default function BookingsPage() {
  const form = useDisclosure();
  const [editing, setEditing] = useState<Booking | null>(null);
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
  });

  const openCreate = () => {
    setEditing(null);
    form.onOpen();
  };
  const openEdit = (booking: Booking) => {
    setEditing(booking);
    form.onOpen();
  };

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
              <Button onClick={openCreate}>
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
                <Th className="text-right">Ações</Th>
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
                <Td>
                  <div className="flex justify-end gap-1">
                    <Tooltip content="Editar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(b)}
                        aria-label={`Editar reserva de ${b.space?.name ?? b.spaceId}`}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <BookingFormDialog open={form.open} onOpenChange={form.setOpen} booking={editing} />
    </div>
  );
}
