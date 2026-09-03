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
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadApplications = useCallback(() => {
    apiFetch<Application[]>('/applications')
      .then(setApplications)
      .finally(() => setLoading(false));
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