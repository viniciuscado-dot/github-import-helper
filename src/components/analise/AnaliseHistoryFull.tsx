import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, CalendarIcon, Eye, FileText, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnaliseRecord {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  nome_empresa?: string;
  nicho_empresa?: string;
  ai_response?: string;
  ai_provider?: string;
  response_generated_at?: string;
  profiles?: { name: string; email: string };
}

interface AnaliseHistoryFullProps {
  briefings: AnaliseRecord[];
  onBack: () => void;
  onView: (briefing: AnaliseRecord) => void;
  onGenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  canDelete: boolean;
  isGenerating: boolean;
}

export function AnaliseHistoryFull({
  briefings,
  onBack,
  onView,
  onGenerate,
  onDelete,
  onRefresh,
  canDelete,
  isGenerating,
}: AnaliseHistoryFullProps) {
  const [clientFilter, setClientFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const uniqueCreators = Array.from(
    new Set(briefings.map(b => b.profiles?.name).filter(Boolean))
  ).sort();

  const filtered = briefings.filter(b => {
    if (clientFilter && !(b.nome_empresa || '').toLowerCase().includes(clientFilter.toLowerCase())) return false;
    if (creatorFilter !== 'all' && b.profiles?.name !== creatorFilter) return false;
    if (startDate && new Date(b.created_at) < startDate) return false;
    if (endDate && new Date(b.created_at) > endDate) return false;
    if (keyword) {
      const k = keyword.toLowerCase();
      const matchName = (b.nome_empresa || '').toLowerCase().includes(k);
      const matchNicho = (b.nicho_empresa || '').toLowerCase().includes(k);
      const matchResponse = (b.ai_response || '').toLowerCase().includes(k);
      if (!matchName && !matchNicho && !matchResponse) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [clientFilter, creatorFilter, startDate, endDate, keyword]);

  const hasFilters = clientFilter || creatorFilter !== 'all' || startDate || endDate || keyword;

  const clearFilters = () => {
    setClientFilter('');
    setCreatorFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setKeyword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Histórico Completo</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} análises encontradas</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por palavra-chave..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Nome do cliente..."
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            />
            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Criador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueCreators.map(c => (
                  <SelectItem key={c} value={c!}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-xs", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-xs", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {endDate ? format(endDate, "dd/MM/yy", { locale: ptBR }) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{briefings.length === 0 ? 'Nenhuma análise encontrada' : 'Nenhum resultado para os filtros aplicados'}</p>
        </div>
      ) : (
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Nicho</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criador</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(briefing => (
                    <TableRow key={briefing.id} className="group">
                      <TableCell className="font-medium">{briefing.nome_empresa || 'Sem nome'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{briefing.nicho_empresa || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(briefing.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={briefing.status === 'completed' ? 'default' : briefing.status === 'processing' ? 'secondary' : briefing.status === 'failed' ? 'destructive' : 'outline'}
                          className={briefing.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : ''}
                        >
                          {briefing.status === 'completed' ? 'Concluído' : briefing.status === 'processing' ? 'Processando' : briefing.status === 'failed' ? 'Erro' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{briefing.profiles?.name || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onView(briefing)} title="Ver resultado">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => onGenerate(briefing.id)}
                            disabled={isGenerating || briefing.status === 'processing'}
                            title="Regenerar"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Análise</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(briefing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pn: number;
                if (totalPages <= 5) pn = i + 1;
                else if (currentPage <= 3) pn = i + 1;
                else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                else pn = currentPage - 2 + i;
                return (
                  <PaginationItem key={pn}>
                    <PaginationLink onClick={() => setCurrentPage(pn)} isActive={currentPage === pn} className="cursor-pointer">
                      {pn}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem><PaginationEllipsis /></PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
