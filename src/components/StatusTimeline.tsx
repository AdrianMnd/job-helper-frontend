import { getStatusMeta } from '@/lib/statuses';

interface StatusHistoryEntry {
  id: string;
  status: string;
  changedAt: string;
}

export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">Sin historial todavia.</p>;
  }

  return (
    <ol className="space-y-0 py-3">
      {history.map((entry, i) => {
        const meta = getStatusMeta(entry.status);
        const isLast = i === history.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">{meta.label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.changedAt).toLocaleString()}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}