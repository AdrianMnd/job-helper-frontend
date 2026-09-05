import { describe, it, expect } from 'vitest';
import { STATUSES, getStatusMeta } from './statuses';

describe('getStatusMeta', () => {
  it('devuelve la metadata correcta para un estado conocido', () => {
    const meta = getStatusMeta('INTERVIEW');
    expect(meta.label).toBe('Entrevista');
  });

  it('devuelve un fallback razonable para un estado desconocido', () => {
    const meta = getStatusMeta('ALGO_NUEVO');
    expect(meta.label).toBe('ALGO_NUEVO');
  });

  it('STATUSES contiene los 6 estados esperados', () => {
    expect(STATUSES).toHaveLength(6);
  });
});