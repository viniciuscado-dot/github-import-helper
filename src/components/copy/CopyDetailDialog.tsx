import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, FileText, ChevronDown, ChevronRight, Building2, Calendar, Sparkles, RefreshCw, Loader2, Send } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CopyFormRecord {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  nome_empresa?: string;
  nomes_empresas?: string;
  document_files?: string[];
  ai_response?: string;
  ai_provider?: string;
  response_generated_at?: string;
  profiles?: { name: string; email: string };
}

interface CopyDetailDialogProps {
  copy: CopyFormRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate?: (copyId: string, instruction: string) => Promise<void>;
}

function exportMarkdownToWord(content: string, fileName: string) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${fileName}</title></head>
    <body style="font-family: Calibri, sans-serif; font-size: 11pt;">${content.replace(/\n/g, '<br>')}</body>
    </html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CopyDetailDialog({ copy, open, onOpenChange, onRegenerate }: CopyDetailDialogProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [regenerateInstruction, setRegenerateInstruction] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!copy) return null;

  const copies = copy.ai_response ? copy.ai_response.split('\n\n=== NOVA COPY ===\n\n') : [];
  const reversedCopies = [...copies].reverse();

  const toggleSection = (index: number) => {
    const next = new Set(expandedSections);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSections(next);
  };

  const handleRegenerate = async () => {
    if (!regenerateInstruction.trim()) {
      toast.error('Informe a instrução para a nova versão');
      return;
    }
    if (!onRegenerate) return;

    setIsRegenerating(true);
    try {
      await onRegenerate(copy.id, regenerateInstruction.trim());
      setShowRegenerateInput(false);
      setRegenerateInstruction('');
    } catch {
      // error handled by parent
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setShowRegenerateInput(false);
        setRegenerateInstruction('');
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                {copy.nomes_empresas || copy.nome_empresa || 'Sem nome'}
              </DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(copy.created_at), "dd 'de' MMMM yyyy, HH:mm", { locale: ptBR })}
                </span>
                <Badge
                  variant={copy.status === 'completed' ? 'default' : copy.status === 'processing' ? 'secondary' : 'destructive'}
                  className={copy.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : ''}
                >
                  {copy.status === 'completed' ? 'Concluído' : copy.status === 'processing' ? 'Processando' : 'Erro'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Regenerate section */}
        {onRegenerate && copy.status === 'completed' && (
          <div className="pt-2">
            {!showRegenerateInput ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowRegenerateInput(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Gerar nova versão
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/20">
                <p className="text-sm font-medium text-foreground">Instrução para nova versão</p>
                <Textarea
                  placeholder="Ex: Ajustar tom para ser mais formal, incluir mais dados numéricos, focar em outro diferencial..."
                  value={regenerateInstruction}
                  onChange={(e) => setRegenerateInstruction(e.target.value)}
                  className="min-h-[80px] resize-none"
                  dir="ltr"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || !regenerateInstruction.trim()}
                    className="gap-2"
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {isRegenerating ? 'Gerando...' : 'Gerar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowRegenerateInput(false);
                      setRegenerateInstruction('');
                    }}
                    disabled={isRegenerating}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {copies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum conteúdo gerado</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {copies.map((content, index) => {
              const isExpanded = expandedSections.has(index);
              const copyDate = index === 0
                ? new Date(copy.created_at)
                : new Date(copy.response_generated_at || copy.created_at);

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 overflow-hidden bg-card/50"
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm text-foreground">
                        Versão {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(copyDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(content.trim());
                          toast.success(`Versão ${index + 1} copiada!`);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          exportMarkdownTableToExcel(
                            content,
                            `copy-${copy.nome_empresa?.replace(/[^a-zA-Z0-9]/g, '-') || 'sem-nome'}-v${index + 1}`
                          );
                        }}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </button>

                  {/* Content */}
                  {isExpanded && (
                    <div className="border-t border-border/40 px-6 py-5 bg-muted/10">
                      <MarkdownRenderer content={content.trim()} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
