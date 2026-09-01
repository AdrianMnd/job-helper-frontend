import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationCard } from './ApplicationCard';

const application = { id: '1', company: 'Acme', position: 'Backend Developer', status: 'APPLIED' };

describe('ApplicationCard', () => {
  it('muestra el puesto y la empresa', () => {
    render(<ApplicationCard application={application} />);
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('llama a onClick al pulsar la tarjeta', () => {
    const onClick = vi.fn();
    render(<ApplicationCard application={application} onClick={onClick} />);
    fireEvent.click(screen.getByText('Backend Developer'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});