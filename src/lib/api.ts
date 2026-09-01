const API_URL = import.meta.env.VITE_API_URL;

interface ApiError {
  error: string | Record<string, unknown>;
}

// Wrapper fino sobre fetch: añade la URL base, el header de auth si hay
// token, y normaliza el manejo de errores para no repetirlo en cada llamada.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: res.statusText }));
    const message = typeof body.error === 'string' ? body.error : 'Error de validacion';
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}