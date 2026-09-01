import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('combina clases condicionales', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('resuelve conflictos de Tailwind quedandose con el ultimo valor', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});