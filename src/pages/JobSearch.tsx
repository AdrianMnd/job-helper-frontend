import { useState, useEffect, type SubmitEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, ExternalLink, Plus, Check } from 'lucide-react';

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
}

const STORAGE_KEY = 'jobSearchState';

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n).toLocaleString('es-ES')}€`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  return fmt((min ?? max)!);
}

function loadInitialState() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return { query: '', location: '', results: null as JobResult[] | null, createdJobIds: [] as string[] };
    const parsed = JSON.parse(saved);
    return {
      query: parsed.query ?? '',
      location: parsed.location ?? '',
      results: parsed.results ?? null,
      createdJobIds: parsed.createdJobIds ?? [],
    };
  } catch {
    return { query: '', location: '', results: null as JobResult[] | null, createdJobIds: [] as string[] };
  }
}

export function JobSearch() {
  const [query, setQuery] = useState(() => loadInitialState().query);
  const [location, setLocation] = useState(() => loadInitialState().location);
  const [results, setResults] = useState<JobResult[] | null>(() => loadInitialState().results);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [createdJobIds, setCreatedJobIds] = useState<Set<string>>(() => new Set(loadInitialState().createdJobIds));

  useEffect(() => {
  // Evita sobreescribir sessionStorage con el estado inicial vacio antes
  // de que el efecto de carga (arriba) haya terminado - sin este guard,
  // el efecto de guardado puede "ganar la carrera" y vaciar los datos
  // que la carga acaba de leer, especialmente bajo el doble-invocado de
  // efectos que hace React.StrictMode en desarrollo.
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ query, location, results, createdJobIds: Array.from(createdJobIds) })
  );
}, [query, location, results, createdJobIds]);

  async function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ query, location });
      const data = await apiFetch<JobResult[]>(`/jobs/search?${params}`);
      setResults(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al buscar ofertas');
    } finally {
      setLoading(false);
    }
  }

  // Llamada directa con fetch (no apiFetch) porque necesitamos distinguir
  // el status 409 (duplicado) del resto de errores para decidir si marcamos
  // la oferta como "ya anadida" o mostramos un error real.
  async function handleCreateApplication(job: JobResult) {
    setCreatingId(job.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          company: job.company,
          position: job.title,
          jobDescription: job.description,
          jobUrl: job.url,
        }),
      });

      if (res.status === 409) {
        toast.info('Ya tienes una candidatura creada desde esta oferta');
        setCreatedJobIds((prev) => new Set(prev).add(job.id));
        return;
      }
      if (!res.ok) {
        throw new Error('Error al crear la candidatura');
      }

      toast.success('Candidatura creada');
      setCreatedJobIds((prev) => new Set(prev).add(job.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la candidatura');
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 font-display text-2xl">Buscar ofertas</h1>

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Puesto (ej. React developer, backend...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          spellCheck={false}
        />
        <Input
          placeholder="Ubicacion (opcional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="sm:w-56"
          spellCheck={false}
        />
        <Button type="submit" disabled={loading}>
          <Search className="size-4" /> Buscar
        </Button>
      </form>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!loading && results !== null && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sin resultados para esta busqueda. Prueba con otro puesto o sin ubicacion.
        </p>
      )}

      {!loading && results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((job) => {
            const salary = formatSalary(job.salaryMin, job.salaryMax);
            const alreadyAdded = createdJobIds.has(job.id);
            return (
              <Card key={job.id} className="rounded-md border-border bg-card shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.company} {job.location && `· ${job.location}`}
                      </p>
                      {salary && (
                        <p className="mt-1 font-stamp text-xs text-muted-foreground">{salary}</p>
                      )}
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'outline' : 'default'}
                        onClick={() => handleCreateApplication(job)}
                        disabled={creatingId === job.id || alreadyAdded}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="size-4" /> Ya anadida
                          </>
                        ) : creatingId === job.id ? (
                          'Creando...'
                        ) : (
                          <>
                            <Plus className="size-4" /> Crear candidatura
                          </>
                        )}
                      </Button>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        Ver original <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
