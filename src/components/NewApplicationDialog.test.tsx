import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewApplicationDialog } from './NewApplicationDialog';

function fillAndOpen() {
  fireEvent.click(screen.getByText('Nueva candidatura'));
  fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'Acme' } });
  fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'Backend Developer' } });
  fireEvent.change(screen.getByLabelText('Descripcion de la oferta'), {
    target: { value: 'Se busca desarrollador backend' },
  });
}

describe('NewApplicationDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('abre el dialogo y muestra el formulario al pulsar el boton', () => {
    render(<NewApplicationDialog onCreated={vi.fn()} />);
    expect(screen.queryByLabelText('Empresa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Nueva candidatura'));

    expect(screen.getByLabelText('Empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('Puesto')).toBeInTheDocument();
  });

  it('envia los datos, avisa a onCreated y cierra el dialogo si la creacion tiene exito', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const onCreated = vi.fn();

    render(<NewApplicationDialog onCreated={onCreated} />);
    fillAndOpen();
    fireEvent.click(screen.getByText('Crear candidatura'));

    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/applications');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      company: 'Acme',
      position: 'Backend Developer',
      jobDescription: 'Se busca desarrollador backend',
      jobUrl: undefined,
    });

    // El dialogo se cierra: el formulario ya no esta en el documento.
    await waitFor(() => expect(screen.queryByLabelText('Empresa')).not.toBeInTheDocument());
  });

  it('mantiene el dialogo abierto y no avisa a onCreated si la creacion falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Datos invalidos' }),
      })
    );
    const onCreated = vi.fn();

    render(<NewApplicationDialog onCreated={onCreated} />);
    fillAndOpen();
    fireEvent.click(screen.getByText('Crear candidatura'));

    await waitFor(() => expect(screen.getByText('Crear candidatura')).not.toBeDisabled());

    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Empresa')).toHaveValue('Acme');
  });

  it('extrae los datos de una imagen subida y rellena el formulario', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          company: 'Globex',
          position: 'Frontend Developer',
          jobDescription: 'Se busca desarrollador frontend',
        }),
      })
    );

    render(<NewApplicationDialog onCreated={vi.fn()} />);
    fireEvent.click(screen.getByText('Nueva candidatura'));

    // El dialogo se renderiza en un portal fuera del contenedor de render,
    // por eso se busca en document en vez de en el resultado de render().
    const fileInput = document.querySelector<HTMLInputElement>('#job-image-upload')!;
    const file = new File(['contenido'], 'oferta.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveValue('Globex'));
    expect(screen.getByLabelText('Puesto')).toHaveValue('Frontend Developer');
    expect(screen.getByLabelText('Descripcion de la oferta')).toHaveValue(
      'Se busca desarrollador frontend'
    );
  });
});
