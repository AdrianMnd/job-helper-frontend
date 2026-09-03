import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from './api';

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('incluye el header Authorization si hay token guardado', async () => {
    localStorage.setItem('token', 'abc');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/test');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer abc');
  });

  it('lanza un error con el mensaje del backend si la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Datos invalidos' }),
      })
    );

    await expect(apiFetch('/test')).rejects.toThrow('Datos invalidos');
  });

  it('devuelve undefined en respuestas 204 sin intentar parsear JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    const result = await apiFetch('/test');
    expect(result).toBeUndefined();
  });
});