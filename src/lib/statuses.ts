export const STATUSES = [
  { value: 'SAVED', label: 'Guardada', color: 'var(--muted-foreground)' },
  { value: 'APPLIED', label: 'Aplicado', color: 'var(--chart-2)' },
  { value: 'INTERVIEW', label: 'Entrevista', color: 'var(--chart-3)' },
  { value: 'OFFER', label: 'Oferta', color: 'var(--chart-1)' },
  { value: 'REJECTED', label: 'Rechazado', color: 'var(--chart-4)' },
  { value: 'WITHDRAWN', label: 'Retirado', color: 'var(--chart-5)' },
] as const;

// Devuelve la metadata de un estado, con un fallback razonable si llegara
// un valor desconocido (defensivo, por si el backend introduce un estado
// nuevo antes de que el frontend lo conozca).
export function getStatusMeta(value: string) {
  return STATUSES.find((s) => s.value === value) ?? { value, label: value, color: 'var(--muted-foreground)' };
}