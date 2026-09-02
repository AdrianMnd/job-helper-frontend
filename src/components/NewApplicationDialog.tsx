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
import { useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';

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
  const [extracting, setExtracting] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  setExtracting(true);
  try {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/applications/extract-from-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) throw new Error('Error al extraer la informacion');
    const data = await res.json();

    setCompany(data.company);
    setPosition(data.position);
    setJobDescription(data.jobDescription);
    toast.success('Datos extraidos de la imagen');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al procesar la imagen');
  } finally {
    setExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
}

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
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
            <Label>Subir imagen de la oferta (opcional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleImageUpload}
              className="hidden"
              id="job-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={extracting}
              onClick={() => fileInputRef.current?.click()}
            >
              {extracting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Extrayendo datos...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> Subir imagen o PDF
                </>
              )}
            </Button>
          </div>
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