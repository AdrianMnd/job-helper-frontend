import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'sin-token'}</span>
      <button onClick={() => login('a@a.com', 'password123')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('login guarda el token en localStorage y actualiza el estado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ token: 'abc123' }) })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('abc123'));
    expect(localStorage.getItem('token')).toBe('abc123');
  });

  it('logout limpia el token', () => {
    localStorage.setItem('token', 'existing');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('logout'));

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('useAuth fuera de AuthProvider lanza un error claro', () => {
    function Broken() {
      useAuth();
      return null;
    }
    // Silenciamos el console.error esperado que React emite al capturar el throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow('useAuth debe usarse dentro de AuthProvider');
    spy.mockRestore();
  });
});