"use client";

import { FormEvent, useState } from "react";
import { Copy } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { CreateInvitationResponse, Role } from "@/lib/types";
import { Alert, Button, Dialog, DialogFooter, Field, Input, Select, toast } from "@/components/ui";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal de convite. Corpo filho do Dialog (monta limpo ao abrir → reseta estado). */
export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Convidar membro"
      description="Gere um convite para alguém entrar na sua organização."
    >
      <InviteForm onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Member");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateInvitationResponse | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch<CreateInvitationResponse>("/invitations", {
        method: "POST",
        body: { email, role },
      });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar convite.");
    } finally {
      setLoading(false);
    }
  };

  // Convite gerado: sem envio de e-mail ainda, mostramos o token e o link do app para
  // o OrgAdmin repassar manualmente ao convidado.
  if (result) {
    const deepLink = `agendify://accept-invite?token=${encodeURIComponent(result.token)}`;
    const copy = (value: string, label: string) => {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    };

    return (
      <div className="space-y-4">
        <Alert tone="success" title="Convite gerado">
          Ainda não há envio automático de e-mail — copie o token ou o link e envie a{" "}
          <strong>{email}</strong>. Expira em{" "}
          {new Date(result.expiresAt).toLocaleDateString("pt-BR")}.
        </Alert>

        <Field label="Token">
          {(p) => (
            <div className="flex gap-2">
              <Input {...p} readOnly value={result.token} onFocus={(e) => e.target.select()} />
              <Button
                type="button"
                variant="outline"
                onClick={() => copy(result.token, "Token")}
                aria-label="Copiar token"
              >
                <Copy className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </Field>

        <Field label="Link do app (mobile)">
          {(p) => (
            <div className="flex gap-2">
              <Input {...p} readOnly value={deepLink} onFocus={(e) => e.target.select()} />
              <Button
                type="button"
                variant="outline"
                onClick={() => copy(deepLink, "Link")}
                aria-label="Copiar link"
              >
                <Copy className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </Field>

        <div className="flex justify-end">
          <Button type="button" onClick={onDone}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email do convidado" required>
        {(p) => (
          <Input
            {...p}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        )}
      </Field>
      <Field label="Papel" required>
        {(p) => (
          <Select {...p} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="Member">Comum (app)</option>
            <option value="OrgAdmin">Administrador (painel)</option>
          </Select>
        )}
      </Field>
      <DialogFooter onCancel={onDone} loading={loading} submitLabel="Gerar convite" />
    </form>
  );
}
