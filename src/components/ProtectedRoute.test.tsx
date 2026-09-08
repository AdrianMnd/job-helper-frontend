import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <Routes>
        <Route path="/login" element={<p>Pagina de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/privado" element={<p>Contenido privado</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirige a /login si no hay token', () => {
    vi.mocked(useAuth).mockReturnValue({ token: null } as ReturnType<typeof useAuth>);
    renderWithRoute();
    expect(screen.getByText('Pagina de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('renderiza la ruta protegida si hay token', () => {
    vi.mocked(useAuth).mockReturnValue({ token: 'abc123' } as ReturnType<typeof useAuth>);
    renderWithRoute();
    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
