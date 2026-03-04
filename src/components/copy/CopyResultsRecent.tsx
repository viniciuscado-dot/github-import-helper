import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Eye, Clock, Building2, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  copy_type?: string;
  profiles?: { name: string; email: string };
}

interface CopyResultsRecentProps {
  briefings: CopyFormRecord[];
  onView: (briefing: CopyFormRecord) => void;
  onViewHistory: () => void;
  isEmpty: boolean;
}

export function CopyResultsRecent({ briefings, onView, onViewHistory, isEmpty }: CopyResultsRecentProps) {
  const recentBriefings = briefings
    .filter(b => b.status === 'completed')
    .slice(0, 6);

  const getVersionCount = (aiResponse?: string) => {
    if (!aiResponse) return 0;
    return aiResponse.split('\n\n=== NOVA COPY ===\n\n').length;
  };

  const isRecent = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Resultados</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Copies geradas com IA</p>
        </div>
        <Button variant="outline" size="sm" onClick={onViewHistory} className="gap-2">
          Ver histórico completo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Recent Results */}
      {isEmpty || recentBriefings.length === 0 ? (
        <div className="text-center py-16">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">Nenhuma copy gerada ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Preencha o formulário e gere sua primeira copy
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Resultados recentes</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentBriefings.map((briefing) => (
              <Card
                key={briefing.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-200",
                  "hover:shadow-md hover:border-primary/20",
                  "bg-card/80 backdrop-blur-sm border-border/60"
                )}
              >
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Client & badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {briefing.nome_empresa || 'Sem nome'}
                          </span>
                        </div>
                        {isRecent(briefing.created_at) && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                            Recente
                          </Badge>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(briefing.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}</span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {getVersionCount(briefing.ai_response)} {getVersionCount(briefing.ai_response) === 1 ? 'versão' : 'versões'}
                        </span>
                      </div>

                      {/* Creator */}
                      <p className="text-xs text-muted-foreground/70">
                        por {briefing.profiles?.name || 'Desconhecido'}
                      </p>
                    </div>

                    {/* Action */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => onView(briefing)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
