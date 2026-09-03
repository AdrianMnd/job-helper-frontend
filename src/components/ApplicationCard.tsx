import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusMeta } from '@/lib/statuses';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
}

// Contenido visual puro, sin logica de arrastre. Se reutiliza tanto en la
// tarjeta normal como en el DragOverlay (la copia que sigue al cursor
// durante el arrastre, renderizada fuera de cualquier columna para que
// nunca quede recortada por los limites de su columna de origen).
export function ApplicationCardVisual({
  application,
  dragging,
}: {
  application: Application;
  dragging?: boolean;
}) {
  const meta = getStatusMeta(application.status);
  return (
    <Card
      className={cn(
        'rounded-md border-border bg-secondary shadow-none transition-colors hover:border-primary/50',
        dragging && 'shadow-lg ring-1 ring-primary'
      )}
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

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn('cursor-grab active:cursor-grabbing', isDragging && 'opacity-30')}
      {...listeners}
      {...attributes}
    >
      <ApplicationCardVisual application={application} />
    </div>
  );
}