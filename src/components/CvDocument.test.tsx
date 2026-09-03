import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CvDocument } from './CvDocument';

describe('CvDocument', () => {
  it('renderiza el CV estructurado completo (schema actual)', () => {
    const content = JSON.stringify({
      keyRequirements: ['TypeScript'],
      fullName: 'Ada Lovelace',
      headline: 'Backend Developer',
      summary: 'Resumen de prueba',
      skillGroups: [{ category: 'Lenguajes', skills: ['TypeScript'] }],
      experience: [{ role: 'Dev', company: 'Acme', period: '2020-2024', bullets: ['Hizo cosas'] }],
      education: [{ degree: 'Ingenieria', institution: 'US', period: '2016-2020' }],
    });

    render(<CvDocument content={content} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Hizo cosas')).toBeInTheDocument();
  });

  it('cae de vuelta a texto plano con JSON invalido', () => {
    render(<CvDocument content="Esto no es JSON valido {" />);
    expect(screen.getByText('Esto no es JSON valido {')).toBeInTheDocument();
  });

  it('cae de vuelta a texto plano si falta el campo experience', () => {
    const content = JSON.stringify({ summary: 'sin experience' });
    render(<CvDocument content={content} />);
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('soporta la version antigua del schema con adaptedDescription en vez de bullets', () => {
    const content = JSON.stringify({
      highlightedSkills: ['Python'],
      experience: [
        { role: 'Dev', company: 'Acme', period: '2020', adaptedDescription: 'Descripcion vieja' },
      ],
    });

    render(<CvDocument content={content} />);

    expect(screen.getByText('Descripcion vieja')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });
});