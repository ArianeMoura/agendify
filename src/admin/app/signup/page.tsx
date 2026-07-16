"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CreateOrganizationResponse } from "@/lib/types";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch<CreateOrganizationResponse>("/organizations", {
        method: "POST",
        body: { organizationName, adminName, adminEmail, adminPassword },
      });
      // Auto-login: o admin recém-criado é OrgAdmin, então passa pelo gate do login()
      // (que também persiste a sessão e popula o usuário).
      await login(adminEmail, adminPassword);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao criar a organização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo orientation="vertical" iconClassName="size-12" />
          <p className="text-ink-muted text-sm">Crie sua organização</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome da organização" required>
            {(p) => (
              <Input
                {...p}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Condomínio Jardins"
                required
                autoFocus
              />
            )}
          </Field>
          <Field label="Seu nome" required>
            {(p) => (
              <Input
                {...p}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Email" required>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="gestor@agendify.dev"
                required
              />
            )}
          </Field>
          <Field label="Senha" required hint="Mínimo de 6 caracteres.">
            {(p) => (
              <Input
                {...p}
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
            )}
          </Field>

          {error && (
            <p className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar organização"}
          </Button>

          <p className="text-ink-muted text-center text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4 hover:opacity-80"
            >
              Entrar
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
