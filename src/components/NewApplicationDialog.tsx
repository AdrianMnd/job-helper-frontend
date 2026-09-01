import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface NewApplicationDialogProps {
  onCreated: () => void;
}

// Dialog controlado (open/onOpenChange) en vez de dejar que shadcn lo maneje
// solo, porque necesitamos poder cerrarlo programaticamente al terminar
// de crear la candidatura con exito.
export function NewApplicationDialog({ onCreated }: NewApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          company,
          position,
          jobDescription,
          jobUrl: jobUrl || undefined,
        }),
      });
      toast.success('Candidatura creada');
      setCompany('');
      setPosition('');
      setJobDescription('');
      setJobUrl('');
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la candidatura');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" /> Nueva candidatura
    </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva candidatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">Puesto</Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobUrl">URL de la oferta (opcional)</Label>
            <Input id="jobUrl" type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobDescription">Descripcion de la oferta</Label>
            <Textarea
              id="jobDescription"
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear candidatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}