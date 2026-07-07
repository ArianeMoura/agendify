"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Booking, Space } from "@/lib/types";
import { Alert, Button, Dialog, Field, Input, Select, toast } from "@/components/ui";

// datetime-local (sem timezone) tratado como UTC — casa com a normalização da API.
function toUtcIso(local: string): string {
  if (!local) return local;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}Z`;
}

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal de nova reserva. O corpo é filho do Dialog (monta limpo a cada abertura). */
export function BookingFormDialog({ open, onOpenChange }: BookingFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova reserva"
      description="Reserve um espaço em um intervalo de tempo."
    >
      <BookingForm onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function BookingForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });

  const [spaceId, setSpaceId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Booking>("/bookings", {
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
      toast.success("Reserva confirmada.");
      onDone();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Erro ao criar reserva.");
      }
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setConflict(null);
    create.mutate();
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

      <div className="border-line flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onDone} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending}>
          Criar reserva
        </Button>
      </div>
    </form>
  );
}
