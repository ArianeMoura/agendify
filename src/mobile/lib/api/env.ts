// URL da API resolvida por variável de ambiente (sem host hardcoded).
// Defina EXPO_PUBLIC_API_URL (ex.: no .env do Expo ou no eas.json) apontando para
// a raiz da API. Em desenvolvimento local, cai para localhost.
export const API_ROOT_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ??
  'http://localhost:5089';

export const API_BASE_URL = `${API_ROOT_URL}/api`;
