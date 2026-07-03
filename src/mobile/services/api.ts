// src/mobile/services/api.ts
const BASE_URL = "https://agendify-api-hcakacdneufubggc.canadacentral-01.azurewebsites.net/api"; // ajuste se sua API estiver em outra porta/URL

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: any
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Adicione Authorization aqui se precisar de token
      // Authorization: `Bearer ${token}`,
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    method === "GET" && body
      ? `${url}?${new URLSearchParams(
          Object.entries(body).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: String(value ?? ""),
            }),
            {} as Record<string, string>
          )
        ).toString()}`
      : url,
    options
  );

  if (!response.ok) {
    // Opcional: lançar erro com detalhes
    const text = await response.text().catch(() => "");
    throw new Error(
      `Erro na requisição ${method} ${url}: ${response.status} ${response.statusText} ${text}`
    );
  }

  // Se não houver conteúdo, retorna null
  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, params?: any) =>
    request<T>(path, "GET", params),
  post: <T>(path: string, body?: any) =>
    request<T>(path, "POST", body),
  put: <T>(path: string, body?: any) =>
    request<T>(path, "PUT", body),
  delete: <T>(path: string, body?: any) =>
    request<T>(path, "DELETE", body),
};