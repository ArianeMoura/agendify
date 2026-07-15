"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { Logo } from "@/components/brand";
import { Alert, Button, Card, Field, Input, toast } from "@/components/ui";

// Destino do link enviado por e-mail (App:BaseUrl + /reset-password?token=…).
export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo orientation="vertical" iconClassName="size-12" />
          <p className="text-ink-muted text-sm">Criar nova senha</p>
        </div>
        {/* useSearchParams exige um limite de Suspense no App Router. */}
        <Suspense fallback={<p className="text-ink-muted text-sm">Carregando…</p>}>
          <ResetForm />
        </Suspense>
      </Card>
    </div>
  );
}

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Link inválido">
          Este endereço não tem um token de redefinição. Abra o link direto do e-mail que você
          recebeu.
        </Alert>
        <p className="text-ink-muted text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-medium underline underline-offset-4 hover:opacity-80"
          >
            Pedir um novo link
          </Link>
        </p>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", { method: "POST", body: { token, password } });
      toast.success("Senha alterada. Entre com a nova senha.");
      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível redefinir a senha. Tente de novo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nova senha" hint="Mínimo de 6 caracteres." required>
        {(p) => (
          <Input
            {...p}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoFocus
          />
        )}
      </Field>
      <Field label="Confirme a nova senha" required>
        {(p) => (
          <Input
            {...p}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
        )}
      </Field>

      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
