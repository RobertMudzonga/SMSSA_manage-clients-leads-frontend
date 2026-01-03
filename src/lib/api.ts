// Default to relative `/api` so Vite dev proxy routes to local backend during development.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export function apiUrl(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, options);
}
