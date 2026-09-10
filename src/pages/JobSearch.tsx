import { useState, useEffect, useRef, type SubmitEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, ExternalLink, Plus, Check, SlidersHorizontal } from 'lucide-react';

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

interface Filters {
  location: string;
  salaryMin: string;
  salaryMax: string;
  contractHours: string; // '' | 'full_time' | 'part_time'
  contractType: string; // '' | 'permanent' | 'contract'
  sortBy: string; // 'relevance' | 'date' | 'salary'
  maxDaysOld: string; // '' | '1' | '7' | '30'
  remoteOnly: boolean;
}

const EMPTY_FILTERS: Filters = {
  location: '',
  salaryMin: '',
  salaryMax: '',
  contractHours: '',
  contractType: '',
  sortBy: 'relevance',
  maxDaysOld: '',
  remoteOnly: false,
};

const STORAGE_KEY = 'jobSearchState';

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n).toLocaleString('es-ES')}€`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  return fmt((min ?? max)!);
}

function countActiveFilters(f: Filters): number {
  let count = 0;
  if (f.location) count++;
  if (f.salaryMin) count++;
  if (f.salaryMax) count++;
  if (f.contractHours) count++;
  if (f.contractType) count++;
  if (f.sortBy !== 'relevance') count++;
  if (f.maxDaysOld) count++;
  if (f.remoteOnly) count++;
  return count;
}

export function JobSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [results, setResults] = useState<JobResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [createdJobIds, setCreatedJobIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          query?: string;
          filters?: Filters;
          results?: JobResult[] | null;
          createdJobIds?: string[];
        };
        setQuery(parsed.query ?? '');
        setFilters(parsed.filters ?? EMPTY_FILTERS);
        setResults(parsed.results ?? null);
        setCreatedJobIds(new Set(parsed.createdJobIds ?? []));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ query, filters, results, createdJobIds: Array.from(createdJobIds) })
    );
  }, [query, filters, results, createdJobIds]);

  // Logica real de busqueda, separada del envio del formulario: asi tanto
  // el submit (Enter / boton Buscar) como el boton "Aplicar" del panel de
  // filtros pueden dispararla sin depender de un evento de formulario.
  async function runSearch() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ query, location: filters.location });
      if (filters.salaryMin) params.set('salaryMin', filters.salaryMin);
      if (filters.salaryMax) params.set('salaryMax', filters.salaryMax);
      if (filters.contractHours) params.set('contractHours', filters.contractHours);
      if (filters.contractType) params.set('contractType', filters.contractType);
      if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
      if (filters.maxDaysOld) params.set('maxDaysOld', filters.maxDaysOld);
      if (filters.remoteOnly) params.set('remoteOnly', 'true');

      const data = await apiFetch<JobResult[]>(`/jobs/search?${params}`);
      setResults(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al buscar ofertas');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    runSearch();
  }

  // Al aplicar filtros, si ya habia una busqueda en marcha (query escrita),
  // la relanza automaticamente con los filtros nuevos - sin esto, el
  // usuario tendria que cerrar el panel y pulsar "Buscar" de nuevo a mano.
  function handleApplyFilters() {
    setFiltersOpen(false);
    if (query.trim()) runSearch();
  }

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
      if (!res.ok) throw new Error('Error al crear la candidatura');

      toast.success('Candidatura creada');
      setCreatedJobIds((prev) => new Set(prev).add(job.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la candidatura');
    } finally {
      setCreatingId(null);
    }
  }

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="p-8">
      <h1 className="mb-6 font-display text-2xl">Buscar ofertas</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Puesto (ej. React developer, backend...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          spellCheck={false}
        />

        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger render={<Button type="button" variant="outline" />}>
            <SlidersHorizontal className="size-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-location">Ubicacion</Label>
              <Input
                id="filter-location"
                placeholder="Ej. Sevilla"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                spellCheck={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="filter-salary-min">Salario minimo</Label>
                <Input
                  id="filter-salary-min"
                  type="number"
                  placeholder="0"
                  value={filters.salaryMin}
                  onChange={(e) => setFilters((f) => ({ ...f, salaryMin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filter-salary-max">Salario maximo</Label>
                <Input
                  id="filter-salary-max"
                  type="number"
                  placeholder="Sin limite"
                  value={filters.salaryMax}
                  onChange={(e) => setFilters((f) => ({ ...f, salaryMax: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Jornada</Label>
              <Select
                items={[
                  { value: '', label: 'Cualquiera' },
                  { value: 'full_time', label: 'Completa' },
                  { value: 'part_time', label: 'Parcial' },
                ]}
                value={filters.contractHours}
                onValueChange={(v) => setFilters((f) => ({ ...f, contractHours: v ?? '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquiera</SelectItem>
                  <SelectItem value="full_time">Completa</SelectItem>
                  <SelectItem value="part_time">Parcial</SelectItem>
                </SelectContent>
              </Select>
              {filters.contractHours && (
                <p className="text-xs text-muted-foreground">
                  Muchas ofertas no especifican este dato y quedaran excluidas.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de contrato</Label>
              <Select
                items={[
                  { value: '', label: 'Cualquiera' },
                  { value: 'permanent', label: 'Indefinido' },
                  { value: 'contract', label: 'Temporal' },
                ]}
                value={filters.contractType}
                onValueChange={(v) => setFilters((f) => ({ ...f, contractType: v ?? '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquiera</SelectItem>
                  <SelectItem value="permanent">Indefinido</SelectItem>
                  <SelectItem value="contract">Temporal</SelectItem>
                </SelectContent>
              </Select>
              {filters.contractType && (
                <p className="text-xs text-muted-foreground">
                  Muchas ofertas no especifican este dato y quedaran excluidas.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Antiguedad del anuncio</Label>
              <Select
                items={[
                  { value: '', label: 'Cualquier fecha' },
                  { value: '1', label: 'Ultimas 24h' },
                  { value: '7', label: 'Ultima semana' },
                  { value: '30', label: 'Ultimo mes' },
                ]}
                value={filters.maxDaysOld}
                onValueChange={(v) => setFilters((f) => ({ ...f, maxDaysOld: v ?? '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier fecha</SelectItem>
                  <SelectItem value="1">Ultimas 24h</SelectItem>
                  <SelectItem value="7">Ultima semana</SelectItem>
                  <SelectItem value="30">Ultimo mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Ordenar por</Label>
              <Select
                items={[
                  { value: 'relevance', label: 'Relevancia' },
                  { value: 'date', label: 'Fecha' },
                  { value: 'salary', label: 'Salario' },
                ]}
                value={filters.sortBy}
                onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v ?? 'relevance' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevancia</SelectItem>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="salary">Salario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="filter-remote"
                checked={filters.remoteOnly}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({ ...f, remoteOnly: checked === true }))
                }
              />
              <Label htmlFor="filter-remote" className="cursor-pointer">
                Solo remoto (aproximado)
              </Label>
            </div>

            <div className="flex justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Limpiar filtros
              </Button>
              <Button type="button" size="sm" onClick={handleApplyFilters}>
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
          Sin resultados para esta busqueda. Prueba con otro puesto, otra ubicacion, o quita algun filtro.
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
