"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError, apiFetch, imageUrl } from "@/lib/api";
import { Space } from "@/lib/types";
import { useDisclosure } from "@/lib/hooks/useDisclosure";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Table,
  TableSkeleton,
  Td,
  Th,
  toast,
  Tooltip,
} from "@/components/ui";
import { SpaceFormDialog } from "./SpaceFormDialog";
/** Miniatura do espaço com fallback: sem imagem OU se a imagem falhar (404), mostra o ícone. */
function SpaceThumb({ src }: { src?: string }) {
  // Guarda a src que falhou (não um booleano): assim o fallback reseta sozinho
  // quando a src muda — ex.: após enviar uma imagem nova para o espaço.
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src) {
    return (
      <span className="bg-surface-muted text-ink-muted flex size-10 items-center justify-center rounded-[var(--radius-sm)]">
        <MapPin className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      onError={() => setFailedSrc(src)}
      className="size-10 rounded-[var(--radius-sm)] object-cover"
    />
  );
}

export default function SpacesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => apiFetch<Space[]>("/spaces"),
  });

  const form = useDisclosure();
  const [editing, setEditing] = useState<Space | null>(null);
  const [toDelete, setToDelete] = useState<Space | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/spaces/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Espaço excluído.");
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erro ao excluir."),
  });

  const openCreate = () => {
    setEditing(null);
    form.onOpen();
  };
  const openEdit = (space: Space) => {
    setEditing(space);
    form.onOpen();
  };

  const spaces = data ?? [];

  return (
    <div>
      <PageHeader
        title="Espaços"
        description="Gerencie os espaços reserváveis."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Novo espaço
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : spaces.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Nenhum espaço cadastrado"
            description="Crie o primeiro espaço para começar a receber reservas."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                Novo espaço
              </Button>
            }
          />
        ) : (
          <Table
            caption="Lista de espaços"
            head={
              <tr>
                <Th className="w-14">Imagem</Th>
                <Th>Nome</Th>
                <Th>Capacidade</Th>
                <Th>Horários</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            }
          >
            {spaces.map((s) => (
              <tr key={s.id} className="hover:bg-surface-muted/50 transition-colors">
                <Td>
                  <SpaceThumb src={imageUrl(s.imageUrl)} />
                </Td>
                <Td className="font-medium">{s.name}</Td>
                <Td>{s.capacity}</Td>
                <Td className="text-ink-muted">{s.availableHours?.length ?? 0} horários</Td>
                <Td>
                  <Badge tone={s.availability ? "success" : "danger"}>
                    {s.availability ? "Disponível" : "Indisponível"}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Tooltip content="Editar">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                        aria-label={`Editar ${s.name}`}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Excluir">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(s)}
                        aria-label={`Excluir ${s.name}`}
                      >
                        <Trash2 className="text-danger size-4" aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <SpaceFormDialog open={form.open} onOpenChange={form.setOpen} space={editing} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir espaço"
        description={`Remover "${toDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}
