import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CalendarIcon, X } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/TopBar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";

type Squad = "Apollo" | "Athena" | "Ares" | "Artemis";

interface MockClient {
  name: string;
  entryDate: string; // DD/MM/YYYY
  squad: Squad;
}

const MOCK_CLIENTS: MockClient[] = [
  { name: "Construlima", entryDate: "05/01/2026", squad: "Apollo" },
  { name: "Sul Solar", entryDate: "12/01/2026", squad: "Athena" },
  { name: "Isocompósitos", entryDate: "18/01/2026", squad: "Ares" },
  { name: "Napelle Laser", entryDate: "22/01/2026", squad: "Artemis" },
  { name: "Thermal Beer", entryDate: "28/01/2026", squad: "Apollo" },
  { name: "Lucab Corporate", entryDate: "02/02/2026", squad: "Athena" },
  { name: "FMP", entryDate: "10/02/2026", squad: "Ares" },
  { name: "Aquiraz Investimentos", entryDate: "18/02/2026", squad: "Artemis" },
];

const SQUAD_COLORS: Record<Squad, string> = {
  Apollo: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Athena: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Ares: "bg-red-500/15 text-red-400 border-red-500/20",
  Artemis: "bg-green-500/15 text-green-400 border-green-500/20",
};

function parseDate(dateStr: string): Date {
  return parse(dateStr, "dd/MM/yyyy", new Date());
}

export default function CopyEstrategia() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [squadFilter, setSquadFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filteredClients = useMemo(() => {
    let clients = [...MOCK_CLIENTS];

    if (search) {
      const q = search.toLowerCase();
      clients = clients.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (squadFilter !== "all") {
      clients = clients.filter((c) => c.squad === squadFilter);
    }

    if (startDate) {
      clients = clients.filter((c) => parseDate(c.entryDate) >= startDate);
    }

    if (endDate) {
      clients = clients.filter((c) => parseDate(c.entryDate) <= endDate);
    }

    // Sort by entry date descending (most recent first)
    clients.sort((a, b) => parseDate(b.entryDate).getTime() - parseDate(a.entryDate).getTime());

    return clients;
  }, [search, squadFilter, startDate, endDate]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleClientClick = (clientName: string) => {
    navigate(`/dashboard?view=copy&client=${encodeURIComponent(clientName)}`);
  };

  const handleSidebarViewChange = (view: string) => {
    if (view === "home-criacao") {
      navigate("/dashboard?view=home-criacao");
    } else if (view === "aprovacao") {
      navigate("/aprovacao");
    } else {
      navigate(`/dashboard?view=${view}`);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar
          activeView="copy"
          onViewChange={handleSidebarViewChange as any}
        />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Back button + Header */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Copy e Estratégia</h1>
                    <p className="text-muted-foreground text-sm">
                      Selecione o cliente/projeto para iniciar a geração estratégica de copy.
                    </p>
                  </div>
                  {(search || squadFilter !== "all" || startDate || endDate) && (
                    <button
                      onClick={() => { setSearch(""); setSquadFilter("all"); setStartDate(undefined); setEndDate(undefined); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={squadFilter} onValueChange={setSquadFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtro por Squad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Squads</SelectItem>
                    <SelectItem value="Apollo">Apollo</SelectItem>
                    <SelectItem value="Athena">Athena</SelectItem>
                    <SelectItem value="Ares">Ares</SelectItem>
                    <SelectItem value="Artemis">Artemis</SelectItem>
                  </SelectContent>
                </Select>

                {/* Data início */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {/* Data fim */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Client cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredClients.map((client) => (
                  <Card
                    key={client.name}
                    onClick={() => handleClientClick(client.name)}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 group"
                  >
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Entrou na DOT em {client.entryDate}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium ${SQUAD_COLORS[client.squad]}`}
                      >
                        {client.squad}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum cliente encontrado com os filtros aplicados.
                </div>
              )}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
