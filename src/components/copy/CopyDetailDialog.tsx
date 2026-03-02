import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, FileSpreadsheet, ChevronDown, ChevronRight, Building2, Calendar, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';

interface CopyFormRecord {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  nome_empresa?: string;
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
}

function exportMarkdownTableToExcel(content: string, fileName: string) {
  const lines = content.split('\n');
  const data: string[][] = [];
  
  lines.forEach(line => {
    if (line.startsWith('|') && !line.match(/^\|[\s-|]+\|$/)) {
      const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
      data.push(cells);
    }
  });

  if (data.length === 0) {
    data.push([content]);
  }
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Copy');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function CopyDetailDialog({ copy, open, onOpenChange }: CopyDetailDialogProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  if (!copy) return null;

  const copies = copy.ai_response ? copy.ai_response.split('\n\n=== NOVA COPY ===\n\n') : [];

  const toggleSection = (index: number) => {
    const next = new Set(expandedSections);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSections(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                {copy.nome_empresa || 'Sem nome'}
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
