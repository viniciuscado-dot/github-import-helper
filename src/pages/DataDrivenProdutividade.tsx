import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/MobileSidebarTrigger";
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Clock, Users, TrendingUp, Package, UserCheck, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ── Mock data ── */
const squadData = [
  { name: "Criação", horas: 342 },
  { name: "Copy", horas: 278 },
  { name: "Mídia", horas: 195 },
  { name: "Estratégia", horas: 230 },
];

const periodoData = [
  { name: "Sem 1", produtividade: 72 },
  { name: "Sem 2", produtividade: 81 },
  { name: "Sem 3", produtividade: 68 },
  { name: "Sem 4", produtividade: 89 },
];

const colaboradorData = [
  { name: "Ana L.", horas: 168 },
  { name: "Carlos M.", horas: 152 },
  { name: "Juliana R.", horas: 144 },
  { name: "Pedro S.", horas: 138 },
  { name: "Marina B.", horas: 127 },
];

const distribuicaoData = [
  { name: "Seg", horas: 48 },
  { name: "Ter", horas: 52 },
  { name: "Qua", horas: 55 },
  { name: "Qui", horas: 50 },
  { name: "Sex", horas: 38 },
];

const kpis = [
  { title: "Horas totais lançadas", value: "1.045h", icon: Clock, color: "text-primary" },
  { title: "Média por colaborador", value: "134,2h", icon: Users, color: "text-blue-500" },
  { title: "Produtividade por squad", value: "82%", icon: TrendingUp, color: "text-emerald-500" },
  { title: "Entregas por período", value: "247", icon: Package, color: "text-amber-500" },
  { title: "Maior volume", value: "Ana L.", icon: UserCheck, color: "text-violet-500" },
  { title: "Eficiência média", value: "78,4%", icon: Gauge, color: "text-rose-500" },
];

const DataDrivenProdutividade = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  const chartCard = "bg-card border rounded-lg p-4";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex w-full">
        <AppSidebar activeView={"home-criacao" as any} onViewChange={() => {}} />
        <div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">
          <MobileSidebarTrigger />
          <SidebarInset className="flex-1 min-h-0 overflow-y-auto">
            <TopBar />
            <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/data-driven")}>
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-foreground">Gestão de Produtividade</h1>
                  <p className="text-muted-foreground">Dashboards e inteligência sobre a produtividade do time.</p>
                </div>
              </div>

              {/* Upload block */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label>Instrução para leitura dos dados</Label>
                    <Textarea
                      placeholder="Descreva como as informações da planilha devem ser interpretadas, quais dados são importantes e que contexto deve ser considerado."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexar planilha</Label>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                      {fileName ? (
                        <p className="text-sm font-medium text-foreground">{fileName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Arraste sua planilha ou clique para enviar</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv</p>
                    </div>
                  </div>

                  <Button variant="gradient" className="w-full sm:w-auto">Atualizar dashboards</Button>
                </CardContent>
              </Card>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select><SelectTrigger className="w-[150px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {["Janeiro","Fevereiro","Março","Abril","Maio","Junho"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select><SelectTrigger className="w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <Select><SelectTrigger className="w-[150px]"><SelectValue placeholder="Squad" /></SelectTrigger>
                  <SelectContent>
                    {["Criação","Copy","Mídia","Estratégia"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select><SelectTrigger className="w-[170px]"><SelectValue placeholder="Colaborador" /></SelectTrigger>
                  <SelectContent>
                    {["Ana L.","Carlos M.","Juliana R.","Pedro S.","Marina B."].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpis.map((k) => (
                  <Card key={k.title}>
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate">{k.title}</span>
                        <k.icon className={`h-4 w-4 shrink-0 ${k.color}`} />
                      </div>
                      <p className="text-xl font-bold text-foreground">{k.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={chartCard}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Horas por Squad</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={squadData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={chartCard}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Produtividade por Período</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={periodoData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Line type="monotone" dataKey="produtividade" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={chartCard}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Horas por Colaborador</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={colaboradorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis dataKey="name" type="category" width={80} className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="horas" fill="hsl(var(--secondary))" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={chartCard}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Horas</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={distribuicaoData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Area type="monotone" dataKey="horas" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DataDrivenProdutividade;
