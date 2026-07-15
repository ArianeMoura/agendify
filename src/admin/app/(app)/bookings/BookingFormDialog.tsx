"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Booking, Space } from "@/lib/types";
import { Alert, Dialog, DialogFooter, Field, Input, Select, toast } from "@/components/ui";

// datetime-local (sem timezone) tratado como UTC — casa com a normalização da API.
function toUtcIso(local: string): string {
  if (!local) return local;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}Z`;
}

// Inverso do toUtcIso: o ISO UTC da API volta ao formato que o datetime-local aceita
// (YYYY-MM-DDTHH:mm). Sem isso o input abre vazio na edição.
function toLocalInput(iso: string): string {
  if (!iso) return "";
  return iso.replace("Z", "").slice(0, 16);
}

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = criação. */
  booking?: Booking | null;
}

/** Modal de nova reserva / edição. O corpo é filho do Dialog (monta limpo a cada abertura). */
export function BookingFormDialog({ open, onOpenChange, booking }: BookingFormDialogProps) {
  const editing = Boolean(booking);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar reserva" : "Nova reserva"}
      description={editing ? undefined : "Reserve um espaço em um intervalo de tempo."}
    >
      <BookingForm booking={booking} onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function BookingForm({ booking, onDone }: { booking?: Booking | null; onDone: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const editing = Boolean(booking);
  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });

  const [spaceId, setSpaceId] = useState(booking?.spaceId ?? "");
  const [start, setStart] = useState(toLocalInput(booking?.startDateTime ?? ""));
  const [end, setEnd] = useState(toLocalInput(booking?.endDateTime ?? ""));
  const [conflict, setConflict] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? apiFetch<Booking>("/bookings", {
            method: "PUT",
            // Sem userId: a API preserva o dono da reserva de propósito.
            body: {
              id: booking!.id,
              spaceId,
              startDateTime: toUtcIso(start),
              endDateTime: toUtcIso(end),
            },
          })
        : apiFetch<Booking>("/bookings", {
            method: "POST",
            body: {
              userId: user?.id,
              spaceId,
              startDateTime: toUtcIso(start),
              endDateTime: toUtcIso(end),
            },
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(editing ? "Reserva atualizada." : "Reserva confirmada.");
      onDone();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(err.message);
      } else {
        toast.error(
          err instanceof Error ? err.message : `Erro ao ${editing ? "editar" : "criar"} reserva.`
        );
      }
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setConflict(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {conflict && (
        <Alert tone="warning" title="Conflito de horário">
          {conflict}
        </Alert>
      )}
      <Field label="Espaço" required>
        {(p) => (
          <Select
            {...p}
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            required
            autoFocus
          >
            <option value="">Selecione…</option>
            {(spaces.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Início" required>
        {(p) => (
          <Input
            {...p}
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        )}
      </Field>
      <Field label="Fim" required>
        {(p) => (
          <Input
            {...p}
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        )}
      </Field>

      <DialogFooter
        onCancel={onDone}
        loading={mutation.isPending}
        submitLabel={editing ? "Salvar alterações" : "Criar reserva"}
      />
    </form>
  );
}
