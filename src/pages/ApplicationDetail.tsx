import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { CvDocument } from '@/components/CvDocument';
import { StatusTimeline } from '@/components/StatusTimeline';
import { STATUSES } from '@/lib/statuses';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';


interface Application {
  id: string;
  company: string;
  position: string;
  jobDescription: string;
  jobUrl: string | null;
  status: string;
  notes: string | null;
}

interface GeneratedDocument {
  id: string;
  docType: 'CV' | 'COVER_LETTER';
  version: number;
  content: string;
  createdAt: string;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  changedAt: string;
}

 async function downloadDocument(applicationId: string, documentId: string, format: 'docx' | 'pdf') {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/applications/${applicationId}/documents/${documentId}/export?format=${format}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) throw new Error('Error al exportar el documento');

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? `documento.${format}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDocType, setConfirmDocType] = useState<'CV' | 'COVER_LETTER' | null>(null);
  const [generating, setGenerating] = useState(false);

  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);

const loadAll = useCallback(async () => {
  if (!id) return;
  setLoading(true);
  const [app, docs, hist] = await Promise.all([
    apiFetch<Application>(`/applications/${id}`),
    apiFetch<GeneratedDocument[]>(`/applications/${id}/documents`),
    apiFetch<StatusHistoryEntry[]>(`/applications/${id}/history`),
  ]);
  setApplication(app);
  setDocuments(docs);
  setHistory(hist);
  setLoading(false);
}, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

async function handleStatusChange(status: string | null) {
  if (!id || !status) return;
  await apiFetch(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  setApplication((a) => (a ? { ...a, status } : a));
  const hist = await apiFetch<StatusHistoryEntry[]>(`/applications/${id}/history`);
  setHistory(hist);
  toast.success('Estado actualizado');
}

  async function handleGenerate() {
    if (!id || !confirmDocType) return;
    setGenerating(true);
    try {
      await apiFetch(`/applications/${id}/generate`, {
        method: 'POST',
        body: JSON.stringify({ docType: confirmDocType }),
      });
      toast.success(confirmDocType === 'CV' ? 'CV generado' : 'Carta generada');
      const docs = await apiFetch<GeneratedDocument[]>(`/applications/${id}/documents`);
      setDocuments(docs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar el documento');
    } finally {
      setGenerating(false);
      setConfirmDocType(null);
    }
  }

  if (loading || !application) {
  return (
    <div className="max-w-3xl p-8">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="mb-6 flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-40 w-full rounded-sm" />
    </div>
  );
}

  const cvDocs = documents.filter((d) => d.docType === 'CV').sort((a, b) => b.version - a.version);
  const letterDocs = documents
    .filter((d) => d.docType === 'COVER_LETTER')
    .sort((a, b) => b.version - a.version);

  return (
    <div className="max-w-3xl p-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Volver al tablero
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">{application.position}</h1>
          <p className="text-muted-foreground">{application.company}</p>
        </div>
        <Select
          items={STATUSES}
          value={application.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Descripcion de la oferta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{application.jobDescription}</p>
          {application.jobUrl && (
            <a>
              href={application.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline"
              Ver oferta original
            </a>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex gap-2">
        <Button onClick={() => setConfirmDocType('CV')}>
          <Sparkles className="size-4" /> Generar CV
        </Button>
        <Button variant="outline" onClick={() => setConfirmDocType('COVER_LETTER')}>
          <Sparkles className="size-4" /> Generar carta
        </Button>
      </div>

      <Tabs defaultValue="cv">
        <TabsList>
          <TabsTrigger value="cv">CV ({cvDocs.length})</TabsTrigger>
          <TabsTrigger value="letter">Carta ({letterDocs.length})</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="cv">
          <DocumentVersions applicationId={application.id} documents={cvDocs} emptyLabel="Todavia no has generado un CV para esta candidatura." />
        </TabsContent>
        <TabsContent value="letter">
          <DocumentVersions applicationId={application.id} documents={letterDocs} emptyLabel="Todavia no has generado una carta para esta candidatura." />
        </TabsContent>
        <TabsContent value="history">
          <StatusTimeline history={history} />
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDocType !== null} onOpenChange={(open) => !open && setConfirmDocType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDocType === 'CV' ? 'Generar CV adaptado' : 'Generar carta de presentacion'}
            </DialogTitle>
            <DialogDescription>
              Esto llama a Gemini para generar una nueva version a partir de tu perfil y esta
              oferta. Las versiones anteriores no se pierden, se guardan en el historial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDocType(null)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generando...' : 'Generar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lista de versiones de un tipo de documento: la mas reciente se muestra
// expandida por defecto, las anteriores en detalles colapsables — asi
// puedes comparar el resultado de distintos prompts sin que la pagina
// se vuelva interminable.
function DocumentVersions({
  applicationId,
  documents,
  emptyLabel,
}: {
  applicationId: string;
  documents: GeneratedDocument[];
  emptyLabel: string;
}) {
  if (documents.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3 py-3">
      {documents.map((doc, i) => (
        <details key={doc.id} open={i === 0} className="rounded-lg border">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm font-medium">
            <span>
              Version {doc.version}
              <span className="ml-2 font-normal text-muted-foreground">
                {new Date(doc.createdAt).toLocaleString()}
              </span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} />}
              >
                <Download className="size-4" /> Descargar
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => downloadDocument(applicationId, doc.id, 'docx')}>
                  Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadDocument(applicationId, doc.id, 'pdf')}>
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </summary>
          <div className="border-t px-4 py-3">
            {doc.docType === 'CV' ? (
              <CvDocument content={doc.content} />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{doc.content}</p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}