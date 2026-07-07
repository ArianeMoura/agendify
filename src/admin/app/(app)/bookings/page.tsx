"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Booking, Space } from "@/lib/types";
import { Badge, Button, Card, Input, Label, Select, Spinner, Table } from "@/components/ui";

// datetime-local (sem timezone) tratado como UTC — casa com a normalização da API.
function toUtcIso(local: string): string {
  if (!local) return local;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}Z`;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function BookingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/bookings"),
  });
  const spaces = useQuery({ queryKey: ["spaces"], queryFn: () => apiFetch<Space[]>("/spaces") });

  const [spaceId, setSpaceId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "conflict" | "error";
    text: string;
  } | null>(null);

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
      setFeedback({ kind: "ok", text: "Reserva criada." });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setFeedback({ kind: "conflict", text: err.message });
      } else {
        setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Erro" });
      }
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    create.mutate();
  };

  const feedbackColor =
    feedback?.kind === "ok"
      ? "text-green-700"
      : feedback?.kind === "conflict"
        ? "text-amber-700"
        : "text-red-600";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reservas</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-0">
          {bookings.isLoading ? (
            <Spinner />
          ) : (
            <Table
              head={
                <tr>
                  <th className="px-4 py-3">Espaço</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Fim</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              }
            >
              {(bookings.data ?? []).map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.space?.name ?? b.spaceId}</td>
                  <td className="px-4 py-3">{fmt(b.startDateTime)}</td>
                  <td className="px-4 py-3">{fmt(b.endDateTime)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={b.status === "confirmed" ? "green" : "neutral"}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
              {(bookings.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-ink-soft px-4 py-8 text-center">
                    Nenhuma reserva.
                  </td>
                </tr>
              )}
            </Table>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-4 font-semibold">Nova reserva</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Espaço</Label>
              <Select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} required>
                <option value="">Selecione…</option>
                {(spaces.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
            {feedback && <p className={`text-sm ${feedbackColor}`}>{feedback.text}</p>}
            <Button type="submit" className="w-full" disabled={create.isPending}>
              {create.isPending ? "Reservando..." : "Criar reserva"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
