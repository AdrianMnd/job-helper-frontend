interface CvExperience {
  role: string;
  company: string;
  period: string;
  bullets?: string[];
  adaptedDescription?: string; // presente en una version anterior del schema
}

interface CvEducation {
  degree: string;
  institution: string;
  period: string;
}

interface CvSkillGroup {
  category: string;
  skills: string[];
}

interface CvContent {
  keyRequirements?: string[];
  fullName?: string;
  headline?: string;
  summary?: string;
  skillGroups?: CvSkillGroup[];
  highlightedSkills?: string[]; // presente en una version mas antigua, sin agrupar
  experience?: CvExperience[];
  education?: CvEducation[];
}

// Intenta interpretar el contenido como CV estructurado. Si no es JSON valido
// o no tiene al menos 'experience' como array, devuelve null y el llamador
// cae de vuelta a mostrar el texto crudo (cubre tanto errores como el primer
// CV en texto libre, de antes de introducir structured output).
function tryParseCv(content: string): CvContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.experience)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

export function CvDocument({ content }: { content: string }) {
  const cv = tryParseCv(content);

  if (!cv) {
    return <p className="whitespace-pre-wrap text-sm">{content}</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      {(cv.fullName || cv.headline) && (
        <div>
          {cv.fullName && <p className="text-base font-semibold">{cv.fullName}</p>}
          {cv.headline && <p className="text-muted-foreground">{cv.headline}</p>}
        </div>
      )}

      {cv.summary && (
        <div>
          <SectionLabel>Resumen</SectionLabel>
          <p>{cv.summary}</p>
        </div>
      )}

      {cv.keyRequirements && cv.keyRequirements.length > 0 && (
        <div>
          <SectionLabel>Requisitos clave detectados</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {cv.keyRequirements.map((req) => (
              <span key={req} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {cv.skillGroups && cv.skillGroups.length > 0 && (
        <div>
          <SectionLabel>Skills</SectionLabel>
          <div className="space-y-1">
            {cv.skillGroups.map((group) => (
              <p key={group.category}>
                <span className="font-medium">{group.category}:</span> {group.skills.join(', ')}
              </p>
            ))}
          </div>
        </div>
      )}

      {cv.highlightedSkills && cv.highlightedSkills.length > 0 && (
        <div>
          <SectionLabel>Skills destacadas</SectionLabel>
          <p>{cv.highlightedSkills.join(', ')}</p>
        </div>
      )}

      {cv.experience && cv.experience.length > 0 && (
        <div>
          <SectionLabel>Experiencia</SectionLabel>
          <div className="space-y-3">
            {cv.experience.map((exp, i) => (
              <div key={i}>
                <p className="font-medium">
                  {exp.role} <span className="font-normal text-muted-foreground">- {exp.company}</span>
                </p>
                <p className="text-xs text-muted-foreground">{exp.period}</p>
                {exp.bullets && exp.bullets.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                ) : exp.adaptedDescription ? (
                  <p className="mt-1">{exp.adaptedDescription}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {cv.education && cv.education.length > 0 && (
        <div>
          <SectionLabel>Educacion</SectionLabel>
          <div className="space-y-1">
            {cv.education.map((edu, i) => (
              <p key={i}>
                <span className="font-medium">{edu.degree}</span> - {edu.institution}{' '}
                <span className="text-xs text-muted-foreground">({edu.period})</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}