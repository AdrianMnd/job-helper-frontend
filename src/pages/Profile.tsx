import { useEffect, useState, type SubmitEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
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

  const suggestions = skillInput.trim()
  ? COMMON_SKILLS.filter(
      (s) =>
        s.toLowerCase().includes(skillInput.trim().toLowerCase()) &&
        !profile.skills.includes(s)
    ).slice(0, 6)
  : [];

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

  function addSkill() {
    addSkillValue(skillInput);
  }

  function addSkillValue(value: string) {
    const trimmed = value.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    setProfile((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    setSkillInput('');
    setShowSuggestions(false);
  }

  function removeSkill(skill: string) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  }

  if (loading) return <div className="p-6 text-muted-foreground">Cargando perfil...</div>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-medium mb-4">Mi perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            rows={4}
            value={profile.summary}
            onChange={(e) => setProfile((p) => ({ ...p, summary: e.target.value }))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Experiencia</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExperience}>
              <Plus className="size-4" /> Anadir
            </Button>
          </div>
          {profile.experience.map((exp, i) => (
            <Card key={i}>
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
            <Card key={i}>
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

        <div className="space-y-1.5">
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
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
                placeholder="Anadir skill y pulsar Enter"
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Anadir
              </Button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    // onMouseDown en vez de onClick: se dispara antes que el onBlur
                    // del input, evitando que el desplegable se cierre antes de
                    // registrar el click en la sugerencia.
                    onMouseDown={() => addSkillValue(s)}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </Button>
      </form>
    </div>
  );
}