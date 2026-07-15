"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, ApiError, setSessionExpiredHandler, tokens } from "./api";
import { LoginResponse, User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

const USER_KEY = "agendify.admin.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidratação da sessão persistida só no cliente. Ler o localStorage num effect
    // (e não no inicializador do estado) é proposital: evita divergência de hidratação
    // SSR/cliente, já que o localStorage não existe durante a renderização no servidor.
    const raw = localStorage.getItem(USER_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (raw && tokens.access) setUser(JSON.parse(raw));
    setLoading(false);
  }, []);

  useEffect(() => {
    // Sessão expirada (401 irrecuperável): limpa o usuário. O AppShell observa
    // `user == null` e redireciona ao /login — sem acoplar a camada de dados a rotas.
    setSessionExpiredHandler(() => {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    // Painel exclusivo de gestores: Org Admin (gestor do tenant) ou Platform Owner.
    if (res.user.role !== "OrgAdmin" && res.user.role !== "PlatformOwner") {
      throw new ApiError(403, "Acesso restrito a gestores.");
    }

    tokens.set(res.token, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokens.refresh;
    if (refresh) {
      await apiFetch("/auth/logout", { method: "POST", body: { refreshToken: refresh } }).catch(
        () => undefined
      );
    }
    tokens.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
