import { useEffect, useState, type SubmitEvent, type KeyboardEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_SKILLS } from '@/lib/commonSkills';

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  period: string;
}

interface ProfileData {
  fullName: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

const EMPTY_PROFILE: ProfileData = {
  fullName: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
};

export function Profile() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Carga el perfil existente al montar. Si el usuario aun no tiene perfil
  // creado, el backend devuelve null y nos quedamos con el formulario vacio.
  useEffect(() => {
    apiFetch<ProfileData | null>('/profile')
      .then((data) => {
        if (data) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      toast.success('Perfil guardado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  }

  function addExperience() {
    setProfile((p) => ({
      ...p,
      experience: [...p.experience, { role: '', company: '', period: '', description: '' }],
    }));
  }

  function updateExperience(index: number, field: keyof Experience, value: string) {
    setProfile((p) => ({
      ...p,
      experience: p.experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }));
  }

  function removeExperience(index: number) {
    setProfile((p) => ({ ...p, experience: p.experience.filter((_, i) => i !== index) }));
  }

  function addEducation() {
    setProfile((p) => ({
      ...p,
      education: [...p.education, { degree: '', institution: '', period: '' }],
    }));
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    setProfile((p) => ({
      ...p,
      education: p.education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu)),
    }));
  }

  function removeEducation(index: number) {
    setProfile((p) => ({ ...p, education: p.education.filter((_, i) => i !== index) }));
  }

  const suggestions = skillInput.trim()
    ? COMMON_SKILLS.filter(
        (s) =>
          s.toLowerCase().includes(skillInput.trim().toLowerCase()) &&
          !profile.skills.includes(s)
      ).slice(0, 6)
    : [];

  function addSkillValue(value: string) {
    const trimmed = value.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    setProfile((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    setSkillInput('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }

  function addSkill() {
    addSkillValue(skillInput);
  }

  function removeSkill(skill: string) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  }

  // Navegacion completa por teclado del combobox de sugerencias: flechas
  // mueven el resaltado (con scroll circular), Enter selecciona la resaltada
  // o anade el texto libre si no hay ninguna, Escape cierra la lista.
  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        addSkillValue(suggestions[highlightedIndex]);
      } else {
        addSkill();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl p-8">
        <Skeleton className="mb-6 h-7 w-40" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-8">
      <h1 className="mb-6 font-display text-2xl">Mi perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Columna izquierda: identidad y skills */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="summary">Resumen profesional</Label>
              <Textarea
                id="summary"
                rows={5}
                value={profile.summary}
                onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 rounded-sm bg-secondary px-3 py-1 text-sm"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} aria-label="Eliminar">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    role="combobox"
                    aria-expanded={showSuggestions && suggestions.length > 0}
                    aria-controls="skill-suggestions-list"
                    aria-activedescendant={
                      highlightedIndex >= 0 ? `skill-suggestion-${highlightedIndex}` : undefined
                    }
                    placeholder="Anadir skill y pulsar Enter"
                    value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={handleSkillKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    Anadir
                  </Button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    id="skill-suggestions-list"
                    role="listbox"
                    className="absolute z-10 mt-1 w-full rounded-sm border border-border bg-popover shadow-md"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={s}
                        id={`skill-suggestion-${i}`}
                        role="option"
                        aria-selected={i === highlightedIndex}
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(i)}
                        // onMouseDown en vez de onClick: se dispara antes que
                        // el onBlur del input, evitando que la lista se cierre
                        // antes de registrar el click en la sugerencia.
                        onMouseDown={() => addSkillValue(s)}
                        className={cn(
                          'block w-full px-3 py-1.5 text-left text-sm',
                          i === highlightedIndex ? 'bg-accent' : 'hover:bg-accent'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: historial profesional */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Experiencia</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                  <Plus className="size-4" /> Anadir
                </Button>
              </div>
              {profile.experience.map((exp, i) => (
                <Card key={i} className="rounded-sm border-border shadow-none">
                  <CardContent className="grid gap-2 pt-4">
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeExperience(i)} aria-label="Eliminar">
                        <X className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    <Input
                      placeholder="Puesto"
                      value={exp.role}
                      onChange={(e) => updateExperience(i, 'role', e.target.value)}
                    />
                    <Input
                      placeholder="Empresa"
                      value={exp.company}
                      onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    />
                    <Input
                      placeholder="Periodo (ej. 2022 - actualidad)"
                      value={exp.period}
                      onChange={(e) => updateExperience(i, 'period', e.target.value)}
                    />
                    <Textarea
                      placeholder="Descripcion"
                      rows={2}
                      value={exp.description}
                      onChange={(e) => updateExperience(i, 'description', e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Educacion</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                  <Plus className="size-4" /> Anadir
                </Button>
              </div>
              {profile.education.map((edu, i) => (
                <Card key={i} className="rounded-sm border-border shadow-none">
                  <CardContent className="grid gap-2 pt-4">
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeEducation(i)} aria-label="Eliminar">
                        <X className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    <Input
                      placeholder="Titulo"
                      value={edu.degree}
                      onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                    />
                    <Input
                      placeholder="Centro"
                      value={edu.institution}
                      onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    />
                    <Input
                      placeholder="Periodo"
                      value={edu.period}
                      onChange={(e) => updateEducation(i, 'period', e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </Button>
      </form>
    </div>
  );
}
