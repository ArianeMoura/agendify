"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserPlus, Users as UsersIcon } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils/date";
import { useDisclosure } from "@/lib/hooks/useDisclosure";
import {
  Avatar,
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
import { UserFormDialog } from "./UserFormDialog";
import { InviteMemberDialog } from "./InviteMemberDialog";

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/users"),
  });

  const form = useDisclosure();
  const invite = useDisclosure();
  const [editing, setEditing] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário excluído.");
      setToDelete(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erro ao excluir."),
  });

  const openCreate = () => {
    setEditing(null);
    form.onOpen();
  };
  const openEdit = (user: User) => {
    setEditing(user);
    form.onOpen();
  };

  const users = data ?? [];

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os acessos ao sistema."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={invite.onOpen}>
              <UserPlus className="size-4" aria-hidden />
              Convidar
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Novo usuário
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Nenhum usuário"
            description="Crie o primeiro acesso ao sistema."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                Novo usuário
              </Button>
            }
          />
        ) : (
          <Table
            caption="Lista de usuários"
            head={
              <tr>
                <Th>Usuário</Th>
                <Th>Email</Th>
                <Th>Perfil</Th>
                <Th>Criado em</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            }
          >
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id} className="hover:bg-surface-muted/50 transition-colors">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} className="size-8" />
                      <span className="font-medium">
                        {u.name}
                        {isSelf && <span className="text-ink-muted ml-1 text-xs">(você)</span>}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-ink-muted">{u.email}</Td>
                  <Td>
                    <Badge tone={u.role === "Member" ? "neutral" : "brand"}>
                      {u.role === "PlatformOwner"
                        ? "Dona da plataforma"
                        : u.role === "OrgAdmin"
                          ? "Administrador"
                          : "Comum"}
                    </Badge>
                  </Td>
                  <Td className="text-ink-muted">{formatDate(u.createdAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Tooltip content="Editar">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(u)}
                          aria-label={`Editar ${u.name}`}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      </Tooltip>
                      <Tooltip content={isSelf ? "Você não pode se excluir" : "Excluir"}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setToDelete(u)}
                          disabled={isSelf}
                          aria-label={`Excluir ${u.name}`}
                        >
                          <Trash2 className="text-danger size-4" aria-hidden />
                        </Button>
                      </Tooltip>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <UserFormDialog
        open={form.open}
        onOpenChange={form.setOpen}
        user={editing}
        isSelf={editing?.id === me?.id}
      />

      <InviteMemberDialog open={invite.open} onOpenChange={invite.setOpen} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir usuário"
        description={`Remover "${toDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}
