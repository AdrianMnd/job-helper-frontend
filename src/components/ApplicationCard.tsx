import { Card, CardContent } from '@/components/ui/card';
import { getStatusMeta } from '@/lib/statuses';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const meta = getStatusMeta(application.status);
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer rounded-md border-border bg-secondary shadow-none transition-colors hover:border-primary/50"
    >
      <CardContent className="p-3">
        <p className="font-display text-sm">{application.position}</p>
        <p className="text-xs text-muted-foreground">{application.company}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="font-stamp text-[10px] text-muted-foreground">{meta.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}