import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, ExternalLink, Plus } from 'lucide-react';

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

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n).toLocaleString('es-ES')}€`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  return fmt((min ?? max)!);
}

export function JobSearch() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<JobResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
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

  async function handleCreateApplication(job: JobResult) {
    setCreatingId(job.id);
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          company: job.company,
          position: job.title,
          jobDescription: job.description,
          jobUrl: job.url,
        }),
      });
      toast.success('Candidatura creada');
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
        />
        <Input
          placeholder="Ubicacion (opcional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="sm:w-56"
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
                        onClick={() => handleCreateApplication(job)}
                        disabled={creatingId === job.id}
                      >
                        <Plus className="size-4" />
                        {creatingId === job.id ? 'Creando...' : 'Crear candidatura'}
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
