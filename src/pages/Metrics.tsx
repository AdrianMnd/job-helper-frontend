import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { getStatusMeta } from '@/lib/statuses';

interface ProcessMetrics {
  totalApplications: number;
  currentStatusCounts: Record<string, number>;
  funnel: { status: string; count: number }[];
  averageDaysInStage: { status: string; averageDays: number | null }[];
}

// Duplica los valores de --chart-* de index.css. Recharts necesita un color
// resoluble en el momento de pintar el SVG; si cambias la paleta alli,
// actualiza tambien este mapa para mantener la coherencia visual.
const STATUS_HEX: Record<string, string> = {
  APPLIED: '#5B6472',
  INTERVIEW: '#E8A93B',
  OFFER: '#3DDC84',
  REJECTED: '#E14F4F',
  WITHDRAWN: '#857A99',
};

export function Metrics() {
  const [metrics, setMetrics] = useState<ProcessMetrics | null>(null);

  useEffect(() => {
    apiFetch<ProcessMetrics>('/applications/metrics/summary').then(setMetrics);
  }, []);

  if (!metrics) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-7 w-40" />
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const funnelData = metrics.funnel.map((f) => ({
    name: getStatusMeta(f.status).label,
    count: f.count,
    fill: STATUS_HEX[f.status],
  }));

  const durationData = metrics.averageDaysInStage
    .filter((d) => d.averageDays !== null)
    .map((d) => ({
      name: getStatusMeta(d.status).label,
      dias: d.averageDays,
      fill: STATUS_HEX[d.status],
    }));

  const interviewRate =
    metrics.funnel[0]?.count > 0
      ? Math.round((metrics.funnel[1].count / metrics.funnel[0].count) * 100)
      : 0;
  const offerRate =
    metrics.funnel[1]?.count > 0
      ? Math.round((metrics.funnel[2].count / metrics.funnel[1].count) * 100)
      : 0;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-display text-2xl">Metricas del proceso</h1>

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{metrics.totalApplications}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Aplicado -&gt; Entrevista</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{interviewRate}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Entrevista -&gt; Oferta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl">{offerRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-base font-normal">
              Embudo de conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-base font-normal">
              Dias medios por fase
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {durationData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aun no hay suficientes cambios de estado para calcular esto.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                    formatter={(value) => [`${value} dias`, 'Duracion media']}
                  />
                  <Bar dataKey="dias" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}