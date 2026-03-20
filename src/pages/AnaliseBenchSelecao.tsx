import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CalendarIcon, X, Plus, Loader2, Check, ChevronsUpDown, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Squad = "Apollo" | "Athena" | "Ares" | "Artemis";

interface CopyClient {
  id: string;
  name: string;
  squad: Squad;
  created_at: string;
}

const SQUAD_COLORS: Record<Squad, string> = {
  Apollo: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Athena: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Ares: "bg-red-500/15 text-red-400 border-red-500/20",
  Artemis: "bg-green-500/15 text-green-400 border-green-500/20",
};

export default function AnaliseBenchSelecao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [squadFilter, setSquadFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [clients, setClients] = useState<CopyClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSquad, setNewSquad] = useState<Squad>("Apollo");
  const [saving, setSaving] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<CopyClient | null>(null);
  const [editName, setEditName] = useState("");
  const [editSquad, setEditSquad] = useState<Squad>("Apollo");

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("copy_clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return;
    }
    setClients((data || []) as CopyClient[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async () => {
    if (!newName.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("copy_clients").insert({
      name: newName.trim(),
      squad: newSquad,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao adicionar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente adicionado com sucesso" });
    setNewName("");
    setNewSquad("Apollo");
    setDialogOpen(false);
    fetchClients();
  };

  const handleEditClient = (e: React.MouseEvent, client: CopyClient) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditName(client.name);
    setEditSquad(client.squad);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClient || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("copy_clients" as any)
      .update({ name: editName.trim(), squad: editSquad } as any)
      .eq("id", editingClient.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao editar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente atualizado com sucesso" });
    setEditDialogOpen(false);
    setEditingClient(null);
    fetchClients();
  };

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (squadFilter !== "all") {
      result = result.filter((c) => c.squad === squadFilter);
    }
    if (startDate) {
      result = result.filter((c) => new Date(c.created_at) >= startDate);
    }
    if (endDate) {
      result = result.filter((c) => new Date(c.created_at) <= endDate);
    }

    return result;
  }, [search, squadFilter, startDate, endDate, clients]);

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/dashboard");
  };

  const handleClientClick = (clientName: string) => {
    navigate(`/dashboard?view=analise-bench&client=${encodeURIComponent(clientName)}`);
  };

  const handleSidebarViewChange = (view: string) => {
    if (view === "home-criacao") navigate("/dashboard?view=home-criacao");
    else if (view === "aprovacao") navigate("/aprovacao");
    else navigate(`/dashboard?view=${view}`);
  };

  const hasFilters = search || squadFilter !== "all" || startDate || endDate;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView="analise-bench" onViewChange={handleSidebarViewChange as any} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Back button + Header */}
              <div className="space-y-1">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Análise e Bench</h1>
                    <p className="text-muted-foreground text-sm">Selecione o cliente/projeto para iniciar a análise de benchmarking.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasFilters && (
                      <button
                        onClick={() => { setSearch(""); setSquadFilter("all"); setStartDate(undefined); setEndDate(undefined); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Limpar filtros
                      </button>
                    )}
                    <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Adicionar Cliente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal h-10", !search && "text-muted-foreground")}>
                      <span className="truncate">{search || "Buscar cliente..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digitar nome do cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        {search && (
                          <CommandItem onSelect={() => setSearch("")} className="text-muted-foreground">
                            <X className="mr-2 h-4 w-4" />
                            Limpar seleção
                          </CommandItem>
                        )}
                        {clients.map((client) => (
                          <CommandItem key={client.id} value={client.name} onSelect={(val) => setSearch(val === search ? "" : val)}>
                            <Check className={cn("mr-2 h-4 w-4", search === client.name ? "opacity-100" : "opacity-0")} />
                            {client.name}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Select value={squadFilter} onValueChange={setSquadFilter}>
                  <SelectTrigger><SelectValue placeholder="Filtro por Squad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Squads</SelectItem>
                    <SelectItem value="Apollo">Apollo</SelectItem>
                    <SelectItem value="Athena">Athena</SelectItem>
                    <SelectItem value="Ares">Ares</SelectItem>
                    <SelectItem value="Artemis">Artemis</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Client cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      onClick={() => handleClientClick(client.name)}
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 group relative"
                    >
                      <button
                        onClick={(e) => handleEditClient(e, client)}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
                        title="Editar cliente"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <CardContent className="p-5 space-y-3">
                        <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">{client.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Adicionado em {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <Badge variant="outline" className={`text-[11px] font-medium ${SQUAD_COLORS[client.squad]}`}>
                          {client.squad}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && filteredClients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum cliente encontrado{hasFilters ? " com os filtros aplicados" : ""}.
                </div>
              )}
            </main>
          </SidebarInset>
        </div>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do cliente</Label>
              <Input id="client-name" placeholder="Ex: Empresa XYZ" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-squad">Squad</Label>
              <Select value={newSquad} onValueChange={(v) => setNewSquad(v as Squad)}>
                <SelectTrigger id="client-squad"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apollo">Apollo</SelectItem>
                  <SelectItem value="Athena">Athena</SelectItem>
                  <SelectItem value="Ares">Ares</SelectItem>
                  <SelectItem value="Artemis">Artemis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddClient} disabled={!newName.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-client-name">Nome do cliente</Label>
              <Input id="edit-client-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-squad">Squad</Label>
              <Select value={editSquad} onValueChange={(v) => setEditSquad(v as Squad)}>
                <SelectTrigger id="edit-client-squad"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apollo">Apollo</SelectItem>
                  <SelectItem value="Athena">Athena</SelectItem>
                  <SelectItem value="Ares">Ares</SelectItem>
                  <SelectItem value="Artemis">Artemis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingClient && (
              <p className="text-xs text-muted-foreground">
                Criado em {format(new Date(editingClient.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
