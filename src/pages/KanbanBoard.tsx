import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationCard } from '@/components/ApplicationCard';
import { NewApplicationDialog } from '@/components/NewApplicationDialog';
import { apiFetch } from '@/lib/api';
import { STATUSES } from '@/lib/statuses';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

// repeat(auto-fit, minmax(240px, 1fr)): el navegador calcula solo cuantas
// columnas de al menos 240px caben en el ancho disponible, y las reparte a
// partes iguales. Al reducir el ancho de la ventana, el numero de columnas
// baja progresivamente sin necesidad de breakpoints manuales, hasta llegar
// a una sola columna en movil - sin scroll horizontal en ningun punto.
const BOARD_GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' };

export function KanbanBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadApplications = useCallback(() => {
    apiFetch<Application[]>('/applications')
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadApplications();

    // Recarga al volver a la pestana: cubre el caso de crear una candidatura
    // desde la extension de Chrome mientras el Kanban esta abierto en otra
    // pestana - sin esto, no te enteras hasta recargar a mano.
    function onFocus() {
      loadApplications();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadApplications]);

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
        <div className="grid gap-5" style={BOARD_GRID_STYLE}>
          {STATUSES.map((status) => {
            const items = applications.filter((a) => a.status === status.value);
            return (
              <Card key={status.value} className="rounded-sm border-border bg-card shadow-none">
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
