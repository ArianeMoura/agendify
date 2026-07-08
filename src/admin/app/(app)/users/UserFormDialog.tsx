"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { CreateUserRequest, Role, UpdateUserRequest, User } from "@/lib/types";
import { Alert, Dialog, DialogFooter, Field, Input, Select, toast } from "@/components/ui";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = criação. */
  user?: User | null;
  /** True quando editando a própria conta (trava o rebaixamento de perfil). */
  isSelf?: boolean;
}

/** Modal de criação/edição de usuário. Corpo filho do Dialog (monta limpo ao abrir). */
export function UserFormDialog({ open, onOpenChange, user, isSelf }: UserFormDialogProps) {
  const editing = Boolean(user);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar usuário" : "Novo usuário"}
      description={editing ? undefined : "Crie um acesso ao sistema."}
    >
      <UserForm user={user} isSelf={isSelf} onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function UserForm({
  user,
  isSelf,
  onDone,
}: {
  user?: User | null;
  isSelf?: boolean;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const editing = Boolean(user);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "Member");

  const mutation = useMutation({
    mutationFn: () => {
      if (editing && user) {
        const body: UpdateUserRequest = { name, email, role };
        if (password) body.password = password;
        return apiFetch(`/users/${user.id}`, { method: "PUT", body });
      }
      const body: CreateUserRequest = { name, email, password, role };
      return apiFetch("/users", { method: "POST", body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(editing ? "Usuário atualizado." : `Usuário "${name}" criado.`);
      onDone();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar usuário.");
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
      <Field label="Email" required>
        {(p) => (
          <Input
            {...p}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
      </Field>
      <Field
        label="Senha"
        required={!editing}
        hint={editing ? "Deixe em branco para manter a senha atual." : "Mínimo de 6 caracteres."}
      >
        {(p) => (
          <Input
            {...p}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editing}
            minLength={6}
            autoComplete="new-password"
          />
        )}
      </Field>
      <Field label="Perfil" required>
        {(p) => (
          <Select
            {...p}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isSelf}
          >
            <option value="Member">Comum (app)</option>
            <option value="OrgAdmin">Administrador (painel)</option>
          </Select>
        )}
      </Field>
      {isSelf && (
        <Alert tone="info">
          Você não pode alterar o próprio perfil para evitar perder o acesso.
        </Alert>
      )}

      <DialogFooter
        onCancel={onDone}
        loading={mutation.isPending}
        submitLabel={editing ? "Salvar" : "Criar usuário"}
      />
    </form>
  );
}
