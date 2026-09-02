import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ApplicationCard } from '@/components/ApplicationCard';
import { NewApplicationDialog } from '@/components/NewApplicationDialog';
import { apiFetch } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { STATUSES } from '@/lib/statuses';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

export function KanbanBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function loadApplications() {
    setLoading(true);
    apiFetch<Application[]>('/applications')
      .then(setApplications)
      .finally(() => setLoading(false));
  }

  useEffect(loadApplications, []);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-background p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-medium">Mis candidaturas</h1>
        <NewApplicationDialog onCreated={loadApplications} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {STATUSES.map((status) => {
            const items = applications.filter((a) => a.status === status.value);
            return (
              <Card
                key={status.value}
                className="shadow-sm border-l-4"
                style={{ borderLeftColor: status.color }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {status.label} <span className="text-xs">({items.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 min-h-30">
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