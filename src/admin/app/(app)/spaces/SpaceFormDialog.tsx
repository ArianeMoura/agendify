"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiForm } from "@/lib/api";
import { Space } from "@/lib/types";
import { Dialog, DialogFooter, Field, Input, Switch, toast } from "@/components/ui";

interface SpaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = criação. */
  space?: Space | null;
}

/**
 * Modal de criação/edição de espaço. O corpo (SpaceForm) é filho do Dialog e o
 * Radix o desmonta ao fechar — então ele monta "limpo" a cada abertura e o estado
 * inicial vem direto das props (sem sincronização por efeito).
 */
export function SpaceFormDialog({ open, onOpenChange, space }: SpaceFormDialogProps) {
  const editing = Boolean(space);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar espaço" : "Novo espaço"}
      description={editing ? undefined : "Cadastre um espaço reservável."}
    >
      <SpaceForm space={space} onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function SpaceForm({ space, onDone }: { space?: Space | null; onDone: () => void }) {
  const qc = useQueryClient();
  const editing = Boolean(space);

  const [name, setName] = useState(space?.name ?? "");
  const [capacity, setCapacity] = useState(space?.capacity ?? 10);
  const [hours, setHours] = useState(
    (space?.availableHours ?? ["08:00", "09:00", "10:00"]).join(", ")
  );
  const [availability, setAvailability] = useState(space?.availability ?? true);
  const [image, setImage] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...(space ?? {}),
        name,
        capacity,
        availability,
        isAllDayBooking: space?.isAllDayBooking ?? false,
        availableHours: hours
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        resources: space?.resources ?? [],
      };
      const form = new FormData();
      form.append("spaceData", JSON.stringify(payload));
      if (image) form.append("image", image);
      return apiForm<Space>("/spaces", form, editing ? "PUT" : "POST");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      toast.success(editing ? "Espaço atualizado." : `Espaço "${name}" criado.`);
      onDone();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar espaço.");
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome" required>
        {(p) => (
          <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
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
      <Field label="Horários" hint="Separados por vírgula (ex.: 08:00, 09:00).">
        {(p) => <Input {...p} value={hours} onChange={(e) => setHours(e.target.value)} />}
      </Field>
      <Field label="Imagem" hint="Opcional. JPG ou PNG.">
        {(p) => (
          <Input
            {...p}
            type="file"
            accept="image/*"
            className="file:bg-brand-50 file:text-brand-700 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:px-3 file:py-1 file:text-sm"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        )}
      </Field>
      <div className="border-line flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2">
        <label htmlFor="space-availability" className="text-ink text-sm font-medium">
          Disponível para reserva
        </label>
        <Switch id="space-availability" checked={availability} onCheckedChange={setAvailability} />
      </div>

      <DialogFooter
        onCancel={onDone}
        loading={mutation.isPending}
        submitLabel={editing ? "Salvar" : "Criar espaço"}
      />
    </form>
  );
}
