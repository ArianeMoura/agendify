// Cliente HTTP do admin para a API .NET. Guarda tokens no localStorage e faz
// refresh silencioso em 401 (rotação de refresh token, igual ao mobile).
const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:5089";
const API_BASE = `${API_ROOT}/api`;

const ACCESS_KEY = "agendify.admin.access";
const REFRESH_KEY = "agendify.admin.refresh";

export const tokens = {
  get access(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Callback disparado quando a sessão expira de vez (401 irrecuperável). A camada
// de UI (AuthProvider) registra o tratamento — a camada de dados NÃO conhece rotas.
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

export function imageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_ROOT}${path}`;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    tokens.clear();
    return false;
  }
  const data = (await res.json()) as { token: string; refreshToken: string };
  tokens.set(data.token, data.refreshToken);
  return true;
}

/**
 * Núcleo compartilhado de requisição: monta o request via `buildInit` (recalculado
 * a cada tentativa, para pegar o token renovado no retry), trata 401→refresh→retry,
 * erros com mensagem e 204. Fonte única — apiFetch e apiForm apenas diferem no init.
 */
async function request<T>(path: string, buildInit: () => RequestInit): Promise<T> {
  const run = () => fetch(`${API_BASE}${path}`, buildInit());

  let res = await run();
  if (res.status === 401 && (await tryRefresh())) res = await run();

  if (res.status === 401) {
    tokens.clear();
    onSessionExpired?.();
    throw new ApiError(401, "Sessão expirada");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, () => ({
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  }));
}

// Requisição multipart (o endpoint de espaços usa [FromForm]). Não define
// Content-Type — o browser injeta o boundary do multipart automaticamente.
export function apiForm<T>(
  path: string,
  form: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  return request<T>(path, () => {
    const headers: Record<string, string> = {};
    if (tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
    return { method, headers, body: form };
  });
}
