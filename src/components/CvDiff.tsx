import { diffWords } from 'diff';
import { cn } from '@/lib/utils';

interface CvExperience {
  role: string;
  company: string;
  period: string;
  bullets?: string[];
  adaptedDescription?: string;
}

interface CvContent {
  fullName?: string;
  headline?: string;
  summary?: string;
  experience?: CvExperience[];
}

function tryParse(content: string): CvContent | null {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// Resalta palabras anadidas (verde) y eliminadas (rojo tachado) entre dos
// textos. Reutiliza los tokens de color de estado que ya existen en el
// tema (--chart-1 verde de "Oferta", --destructive rojo) en vez de inventar
// una paleta nueva solo para el diff.
function WordDiff({ before, after }: { before: string; after: string }) {
  if (before === after) return <span>{after}</span>;

  const parts = diffWords(before, after);
  return (
    <span>
      {parts.map((part, i) => (
        <span
          key={i}
          className={cn(
            part.added && 'bg-[var(--chart-1)]/20 text-[var(--chart-1)]',
            part.removed && 'bg-destructive/20 text-destructive line-through'
          )}
        >
          {part.value}
        </span>
      ))}
    </span>
  );
}

function Field({ label, before, after }: { label: string; before: string; after: string }) {
  if (!before && !after) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">
        <WordDiff before={before} after={after} />
      </p>
    </div>
  );
}

export function CvDiff({ before, after }: { before: string; after: string }) {
  const cvBefore = tryParse(before);
  const cvAfter = tryParse(after);

  if (!cvBefore || !cvAfter) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Version anterior</p>
          <p className="whitespace-pre-wrap text-sm">{before}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Version nueva</p>
          <p className="whitespace-pre-wrap text-sm">{after}</p>
        </div>
      </div>
    );
  }

  const experienceBefore = cvBefore.experience ?? [];
  const experienceAfter = cvAfter.experience ?? [];
  const maxExperience = Math.max(experienceBefore.length, experienceAfter.length);

  return (
    <div className="space-y-4">
      <Field label="Nombre" before={cvBefore.fullName ?? ''} after={cvAfter.fullName ?? ''} />
      <Field label="Titular" before={cvBefore.headline ?? ''} after={cvAfter.headline ?? ''} />
      <Field label="Resumen" before={cvBefore.summary ?? ''} after={cvAfter.summary ?? ''} />

      {maxExperience > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Experiencia
          </p>
          <div className="space-y-3">
            {Array.from({ length: maxExperience }).map((_, i) => {
              const expBefore = experienceBefore[i];
              const expAfter = experienceAfter[i];
              const bulletsBefore = expBefore?.bullets ?? (expBefore?.adaptedDescription ? [expBefore.adaptedDescription] : []);
              const bulletsAfter = expAfter?.bullets ?? (expAfter?.adaptedDescription ? [expAfter.adaptedDescription] : []);
              const maxBullets = Math.max(bulletsBefore.length, bulletsAfter.length);

              return (
                <div key={i} className="rounded-sm border border-border p-3">
                  <p className="text-sm font-medium">
                    {expAfter?.role ?? expBefore?.role} - {expAfter?.company ?? expBefore?.company}
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {Array.from({ length: maxBullets }).map((_, j) => (
                      <li key={j} className="text-sm">
                        <WordDiff before={bulletsBefore[j] ?? ''} after={bulletsAfter[j] ?? ''} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}