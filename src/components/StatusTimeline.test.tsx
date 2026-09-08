import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from './StatusTimeline';

describe('StatusTimeline', () => {
  it('muestra un mensaje cuando no hay historial', () => {
    render(<StatusTimeline history={[]} />);
    expect(screen.getByText('Sin historial todavia.')).toBeInTheDocument();
  });

  it('muestra la etiqueta de cada estado del historial', () => {
    const history = [
      { id: '1', status: 'SAVED', changedAt: '2024-01-01T10:00:00Z' },
      { id: '2', status: 'APPLIED', changedAt: '2024-01-02T10:00:00Z' },
    ];
    render(<StatusTimeline history={history} />);
    expect(screen.getByText('Guardada')).toBeInTheDocument();
    expect(screen.getByText('Aplicado')).toBeInTheDocument();
  });

  it('usa el propio valor como etiqueta si el estado es desconocido', () => {
    const history = [{ id: '1', status: 'ESTADO_RARO', changedAt: '2024-01-01T10:00:00Z' }];
    render(<StatusTimeline history={history} />);
    expect(screen.getByText('ESTADO_RARO')).toBeInTheDocument();
  });
});
