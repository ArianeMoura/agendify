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
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
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

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const run = () =>
    fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  let res = await run();

  if (res.status === 401 && (await tryRefresh())) {
    res = await run();
  }

  if (res.status === 401) {
    tokens.clear();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Sessão expirada");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Requisição multipart (o endpoint de espaços usa [FromForm]). Não define
// Content-Type — o browser injeta o boundary do multipart automaticamente.
export async function apiForm<T>(path: string, form: FormData, method: "POST" | "PUT" = "POST"): Promise<T> {
  const run = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {},
      body: form,
    });

  let res = await run();
  if (res.status === 401 && (await tryRefresh())) res = await run();

  if (res.status === 401) {
    tokens.clear();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Sessão expirada");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
