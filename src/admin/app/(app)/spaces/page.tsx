"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiForm, ApiError } from "@/lib/api";
import { Space } from "@/lib/types";
import { Badge, Button, Card, Field, Input, LoadingBlock, Table } from "@/components/ui";

export default function SpacesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => apiFetch<Space[]>("/spaces"),
  });

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [hours, setHours] = useState("08:00, 09:00, 10:00");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const spaceData = {
        name,
        capacity,
        availability: true,
        isAllDayBooking: false,
        availableHours: hours
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        resources: [],
      };
      const form = new FormData();
      form.append("spaceData", JSON.stringify(spaceData));
      return apiForm<Space>("/spaces", form);
    },
    onSuccess: () => {
      setName("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Erro ao criar espaço"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Espaços</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-0">
          {isLoading ? (
            <LoadingBlock />
          ) : (
            <Table
              head={
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Capacidade</th>
                  <th className="px-4 py-3">Horários</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              }
            >
              {(data ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.capacity}</td>
                  <td className="text-ink-soft px-4 py-3">
                    {s.availableHours?.length ?? 0} horários
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.availability ? "success" : "danger"}>
                      {s.availability ? "Disponível" : "Indisponível"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-ink-soft px-4 py-8 text-center">
                    Nenhum espaço cadastrado.
                  </td>
                </tr>
              )}
            </Table>
          )}
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-4 font-semibold">Novo espaço</h2>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nome" required>
              {(p) => (
                <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required />
              )}
            </Field>
            <Field label="Capacidade" required>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  required
                />
              )}
            </Field>
            <Field label="Horários (separados por vírgula)">
              {(p) => <Input {...p} value={hours} onChange={(e) => setHours(e.target.value)} />}
            </Field>
            {error && (
              <p className="text-danger text-sm" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={create.isPending}>
              {create.isPending ? "Salvando..." : "Criar espaço"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
