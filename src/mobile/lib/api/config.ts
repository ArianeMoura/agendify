import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ROOT_URL } from './env';
import { tokenStore } from '../storage/tokenStore';

export const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_ROOT_URL}${imageUrl}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Anexa o access token (lido do armazenamento seguro) a cada requisição.
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback opcional para o AuthProvider reagir a uma sessão expirada
// (ex.: limpar o usuário em memória e redirecionar para o login).
let onSessionExpired: (() => void) | null = null;
export const setOnSessionExpired = (cb: (() => void) | null) => {
  onSessionExpired = cb;
};

// Refresh silencioso: em 401, tenta trocar o refresh token uma única vez e
// repete a requisição original. Usa axios "cru" para não recorrer nos interceptors.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStore.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    const { token, refreshToken: newRefresh } = res.data as {
      token: string;
      refreshToken: string;
    };
    await tokenStore.setTokens(token, newRefresh);
    return token;
  } catch {
    await tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isRefreshCall
    ) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh falhou → sessão encerrada.
      await tokenStore.clear();
      onSessionExpired?.();
    }

    return Promise.reject(error);
  },
);
