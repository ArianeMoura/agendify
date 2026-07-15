"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo orientation="vertical" iconClassName="size-12" />
          <p className="text-ink-muted text-sm">Painel de gestão</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" required>
            {(p) => (
              <Input
                {...p}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gestor@agendify.dev"
                required
              />
            )}
          </Field>
          <Field label="Senha" required>
            {(p) => (
              <Input
                {...p}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </Field>

          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="text-ink-muted font-medium underline underline-offset-4 hover:opacity-80"
            >
              Esqueci minha senha
            </Link>
          </p>

          {error && (
            <p className="text-danger text-sm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-ink-muted text-center text-sm">
            Ainda não tem uma organização?{" "}
            <Link href="/signup" className="font-medium underline underline-offset-4 hover:opacity-80">
              Criar organização
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
