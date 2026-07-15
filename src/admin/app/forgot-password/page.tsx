"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Logo } from "@/components/brand";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
    } catch {
      // A API responde igual para e-mail cadastrado ou não, de propósito. Um erro aqui é de
      // rede, e mostrá-lo separado ainda revelaria mais do que a tela deve revelar.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo orientation="vertical" iconClassName="size-12" />
          <p className="text-ink-muted text-sm">Recuperar acesso</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <Alert tone="success" title="Verifique seu e-mail">
              Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. O link
              vale por 30 minutos.
            </Alert>
            <p className="text-ink-muted text-center text-sm">
              <Link href="/login" className="font-medium underline underline-offset-4 hover:opacity-80">
                Voltar para o login
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-ink-muted text-sm">
              Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
            </p>
            <Field label="Email" required>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestor@agendify.dev"
                  required
                  autoFocus
                />
              )}
            </Field>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>

            <p className="text-ink-muted text-center text-sm">
              Lembrou a senha?{" "}
              <Link href="/login" className="font-medium underline underline-offset-4 hover:opacity-80">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
