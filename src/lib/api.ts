export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://smssa-backend.onrender.com/api';

export function apiUrl(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, options);
}
