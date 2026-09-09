import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ApplicationCard, ApplicationCardVisual } from '@/components/ApplicationCard';
import { NewApplicationDialog } from '@/components/NewApplicationDialog';
import { apiFetch } from '@/lib/api';
import { STATUSES } from '@/lib/statuses';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDoubleBackToExit } from '@/hooks/useDoubleBackToExit';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

const BOARD_GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' };

function DroppableColumn({ status, children }: { status: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'rounded-sm border-border bg-card shadow-none transition-colors',
        isOver && 'border-primary ring-1 ring-primary'
      )}
    >
      {children}
    </Card>
  );
}

export function KanbanBoard() {
  useDoubleBackToExit(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  // Distinto de "loading": indica que se agotaron los reintentos sin
  // conseguir respuesta del backend (tipicamente un cold start de Render
  // mas largo de lo habitual). Sin este estado propio, la UI no podia
  // distinguir "no hay candidaturas de verdad" de "no se pudo conectar" -
  // ambos casos renderizaban un tablero visualmente vacio e identico.
  const [loadError, setLoadError] = useState(false);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await apiFetch<Application[]>('/applications');
        setApplications(data);
        setLoading(false);
        return;
      } catch {
        if (attempt === maxAttempts) {
          setLoadError(true);
          setLoading(false);
          return;
        }
        // Backoff creciente: da tiempo a que Render termine de arrancar el
        // contenedor tras el reposo por inactividad, en vez de rendirse tras
        // el primer fallo de conexion.
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }, []);

  useEffect(() => {
    loadApplications();
    function onFocus() {
      loadApplications();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadApplications]);

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const applicationId = active.id as string;
    const newStatus = over.id as string;
    const current = applications.find((a) => a.id === applicationId);
    if (!current || current.status === newStatus) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );

    try {
      await apiFetch(`/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      toast.error('No se pudo mover la candidatura');
      loadApplications();
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Mis candidaturas</h1>
        <NewApplicationDialog onCreated={loadApplications} />
      </div>

      {loading ? (
        <div className="grid gap-5" style={BOARD_GRID_STYLE}>
          {STATUSES.map((status) => (
            <div key={status.value} className="space-y-3 rounded-sm border border-border bg-card p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full rounded-sm" />
              <Skeleton className="h-16 w-full rounded-sm" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-sm border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No se pudo conectar con el servidor. Puede que este arrancando tras un periodo de
            inactividad.
          </p>
          <Button onClick={loadApplications}>Reintentar</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-5" style={BOARD_GRID_STYLE}>
            {STATUSES.map((status) => {
              const items = applications.filter((a) => a.status === status.value);
              return (
                <DroppableColumn key={status.value} status={status.value}>
                  <CardHeader className="border-b border-border pb-3">
                    <CardTitle className="font-display text-sm font-normal text-muted-foreground">
                      {status.label} <span className="font-stamp text-xs">({items.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-3 min-h-30">
                    {items.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onClick={() => navigate(`/applications/${app.id}`)}
                      />
                    ))}
                  </CardContent>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeApp ? <ApplicationCardVisual application={activeApp} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
