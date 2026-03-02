import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, FileText, Settings, X, Save, Eye, Copy, RefreshCw, Search, Send, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/external-client"
import { useModulePermissions } from "@/hooks/useModulePermissions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CopyGenerationOverlay } from '@/components/CopyGenerationOverlay'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { AnaliseResultsRecent } from '@/components/analise/AnaliseResultsRecent'
import { AnaliseHistoryFull } from '@/components/analise/AnaliseHistoryFull'

// Schema de validação do formulário
const analiseFormSchema = z.object({
  client_id: z.string().optional(),
  
  // Informações do Cliente
  nome_empresa: z.string().optional(),
  nicho_empresa: z.string().optional(),
  site: z.string().optional(),
  servicos_produtos: z.string().optional(),
  diferenciais_competitivos: z.string().optional(),
  publico_alvo: z.string().optional(),
  objetivo_projeto: z.string().optional(),
  maior_desafio: z.string().optional(),
  
  // Concorrentes (array dinâmico)
  quantos_concorrentes: z.number().min(1).max(5).default(1),
  
  // Foco da Análise
  objetivo_benchmark: z.array(z.string()).optional(),
  objetivo_benchmark_outro: z.string().optional(),
  aspecto_prioritario: z.string().optional(),
  informacoes_adicionais: z.string().optional(),
})

type AnaliseFormData = z.infer<typeof analiseFormSchema>

interface Competitor {
  id: string
  nome: string
  tipo: 'direto' | 'indireto'
  site: string
  instagram_linkedin: string
  porque_escolhido: string
}

export function AnaliseBench() {
  const { profile } = useAuth()
  const { checkModulePermission, loading: permissionsLoading } = useModulePermissions()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"formulario" | "resultados" | "prompts">("formulario")
  const [crmClients, setCrmClients] = useState<any[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: '1', nome: '', tipo: 'direto', site: '', instagram_linkedin: '', porque_escolhido: '' }
  ])
  const [briefingHistory, setBriefingHistory] = useState<any[]>([])
  const [selectedBriefing, setSelectedBriefing] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [generatingBriefingId, setGeneratingBriefingId] = useState<string | null>(null)
  const [overlayStatus, setOverlayStatus] = useState<'generating' | 'success' | 'error' | null>(null)
  const [overlayError, setOverlayError] = useState<string | undefined>(undefined)
  const [pendingRetryId, setPendingRetryId] = useState<string | null>(null)

  const ANALISE_STEP_MESSAGES = [
    'Lendo dados da campanha…',
    'Cruzando métricas de desempenho…',
    'Comparando benchmarks do setor…',
    'Identificando gargalos estratégicos…',
    'Mapeando oportunidades de crescimento…',
    'Gerando insights estratégicos…',
    'Finalizando análise…',
  ]
  
  // Estados para gerenciar prompts padrão
  const [defaultPrompts, setDefaultPrompts] = useState<any[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [newPromptTitle, setNewPromptTitle] = useState('')
  const [newPromptContent, setNewPromptContent] = useState('')
  const [collapsedPrompts, setCollapsedPrompts] = useState<Set<string>>(new Set())
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)
  
  // Opções para objetivo do benchmark
  const objetivoBenchmarkOptions = [
    "Identificar pontos de posicionamento no mercado",
    "Entender estratégias de captação de leads dos concorrentes",
    "Mapear argumentos de venda mais usados",
    "Avaliar funis e jornadas de compra",
    "Analisar comunicação visual e tom de voz"
  ]

  const canCreate = checkModulePermission('analise_bench', 'create')
  const canView = checkModulePermission('analise_bench', 'view')
  const canEdit = checkModulePermission('analise_bench', 'edit')
  const canDelete = checkModulePermission('analise_bench', 'delete')
  const isAdmin = profile?.effectiveRole === 'admin'
  
  // Regra de negócio: Acesso aos prompts requer permissões de editar E excluir
  const canAccessPrompts = (canEdit && canDelete) || isAdmin

  const form = useForm<AnaliseFormData>({
    resolver: zodResolver(analiseFormSchema),
    defaultValues: {
      client_id: '',
      quantos_concorrentes: 1,
      objetivo_benchmark: [],
    },
  })

  // Sincronizar selectedClient com o form
  useEffect(() => {
    if (selectedClient) {
      form.setValue('client_id', selectedClient)
    }
  }, [selectedClient])

  // Buscar clientes do CRM
  const fetchCRMClients = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_cards')
        .select('id, company_name, title')
        .order('company_name', { ascending: true })
      
      if (error) throw error
      
      const uniqueCompanies = Array.from(
        new Map(
          (data || [])
            .filter(card => card.company_name && card.company_name.trim() !== '')
            .map(card => [card.company_name, card])
        ).values()
      )
      
      setCrmClients(uniqueCompanies)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  // Buscar histórico de briefings
  const fetchBriefingHistory = async () => {
    if (!canView) return
    
    try {
      console.log('🔍 Buscando histórico de análises...')
      const { data, error } = await supabase
        .from('analise_bench_forms')
        .select(`
          *,
          profiles:created_by(name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Erro RLS ao buscar histórico:', error)
        throw error
      }
      
      console.log(`✅ ${data?.length || 0} análises encontradas`)
      setBriefingHistory(data || [])
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      toast.error('Erro ao carregar histórico de análises')
    }
  }

  useEffect(() => {
    fetchCRMClients()
    if (canView) {
      fetchBriefingHistory()
    }
    if (canAccessPrompts) {
      fetchDefaultPrompts()
    }
  }, [canView, canAccessPrompts])

  // Sincronizar selectedClient com o campo do formulário
  useEffect(() => {
    if (selectedClient) {
      form.setValue('client_id', selectedClient)
    }
  }, [selectedClient, form])

  // Gerenciar concorrentes dinâmicos
  const handleAddCompetitor = () => {
    if (competitors.length < 10) {
      setCompetitors([
        ...competitors,
        { id: Date.now().toString(), nome: '', tipo: 'direto', site: '', instagram_linkedin: '', porque_escolhido: '' }
      ])
    }
  }

  const handleRemoveCompetitor = (id: string) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter(c => c.id !== id))
    }
  }

  const handleCompetitorChange = (id: string, field: keyof Competitor, value: any) => {
    setCompetitors(competitors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  // Funções para gerenciar prompts padrão
  const fetchDefaultPrompts = async () => {
    if (!canAccessPrompts) return
    
    setIsLoadingPrompts(true)
    try {
      const { data, error } = await supabase
        .from('default_prompts')
        .select('*')
        .eq('is_active', true)
        .eq('copy_type', 'analise_bench')
        .order('position', { ascending: true })

      if (error) throw error
      setDefaultPrompts(data || [])
    } catch (error) {
      console.error('Erro ao buscar prompts padrão:', error)
      toast.error('Erro ao carregar prompts')
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const handleCreatePrompt = async () => {
    if (!newPromptTitle.trim() || !newPromptContent.trim()) {
      toast.error("Título e conteúdo são obrigatórios")
      return
    }

    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase
        .from('default_prompts')
        .insert({
          title: newPromptTitle,
          content: newPromptContent,
          created_by: profile?.user_id,
          position: defaultPrompts.length,
          copy_type: 'analise_bench',
          is_active: true
        })

      if (error) throw error

      toast.success("Prompt criado com sucesso!")
      setNewPromptTitle('')
      setNewPromptContent('')
      setShowCreatePrompt(false)
      fetchDefaultPrompts()
    } catch (error) {
      console.error('Erro ao criar prompt:', error)
      toast.error("Erro ao criar prompt")
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const handleUpdatePrompt = async (id: string, title: string, content: string) => {
    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase
        .from('default_prompts')
        .update({ title, content })
        .eq('id', id)

      if (error) throw error

      toast.success("Prompt atualizado com sucesso!")
      setEditingPrompt(null)
      fetchDefaultPrompts()
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error)
      toast.error("Erro ao atualizar prompt")
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const handleDeletePrompt = async (id: string) => {
    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase
        .from('default_prompts')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      toast.success("Prompt removido com sucesso!")
      fetchDefaultPrompts()
    } catch (error) {
      console.error('Erro ao remover prompt:', error)
      toast.error("Erro ao remover prompt")
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const onSubmit = async (data: AnaliseFormData) => {
    console.log('🚀 onSubmit chamado com dados:', data)
    
    if (!canCreate) {
      toast.error("Você não tem permissão para criar análises")
      return
    }

    setIsLoading(true)
    setOverlayStatus('generating')
    setOverlayError(undefined)
    
    try {
      const { data: authUser } = await supabase.auth.getUser()
      const createdBy = profile?.user_id ?? authUser?.user?.id
      if (!createdBy) throw new Error('Usuário não autenticado')

      console.log('💾 Salvando briefing...')
      
      // Remover campo quantos_concorrentes que não existe no banco
      const { quantos_concorrentes, ...briefingData } = data;
      
      // Salvar briefing com concorrentes
      const { data: savedForm, error: saveError } = await supabase
        .from('analise_bench_forms')
        .insert({
          ...briefingData,
          competitors: competitors as any,
          created_by: createdBy,
          status: 'processing',
        })
        .select()
        .single()

      if (saveError) throw saveError

      console.log('✅ Briefing salvo:', savedForm.id)
      setPendingRetryId(savedForm.id)
      
      // Gerar análise automaticamente
      try {
        console.log('🤖 Chamando edge function generate-analise-bench...')
        
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('generate-analise-bench', {
          body: { briefingId: savedForm.id }
        })

        if (analysisError) {
          console.error('❌ Erro na edge function:', analysisError)
          throw analysisError
        }

        console.log('✅ Análise gerada com sucesso!')
        setOverlayStatus('success')
        
        // Aguardar overlay de sucesso ser exibido
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Atualizar histórico
        await fetchBriefingHistory()
        
        // Buscar o briefing atualizado para mostrar
        const { data: updatedBriefing } = await supabase
          .from('analise_bench_forms')
          .select('*')
          .eq('id', savedForm.id)
          .single()
        
        if (updatedBriefing) {
          setSelectedBriefing(updatedBriefing)
        }
        
        // Fechar overlay e ir para resultados
        setOverlayStatus(null)
        setActiveTab("resultados")
      } catch (analysisError: any) {
        console.error('❌ Erro ao gerar análise:', analysisError)
        setOverlayStatus('error')
        setOverlayError(analysisError?.message || 'Erro desconhecido')
        
        // Reverter status para pending
        await supabase
          .from('analise_bench_forms')
          .update({ status: 'pending' })
          .eq('id', savedForm.id)
      }
      
      form.reset()
      setCompetitors([{ id: '1', nome: '', tipo: 'direto', site: '', instagram_linkedin: '', porque_escolhido: '' }])
    } catch (error: any) {
      console.error('Erro ao salvar briefing:', error)
      setOverlayStatus('error')
      setOverlayError(error?.message || 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAnalysis = async (briefingId: string) => {
    setIsGeneratingAnalysis(true)
    setGeneratingBriefingId(briefingId)
    setOverlayStatus('generating')
    setOverlayError(undefined)
    setPendingRetryId(briefingId)
    
    try {
      // Atualizar status para processing
      await supabase
        .from('analise_bench_forms')
        .update({ status: 'processing' })
        .eq('id', briefingId)

      const { data, error } = await supabase.functions.invoke('generate-analise-bench', {
        body: { briefingId }
      })

      if (error) throw error

      setOverlayStatus('success')
      
      // Aguardar overlay de sucesso
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Atualizar histórico
      await fetchBriefingHistory()
      
      // Buscar o briefing atualizado para mostrar o resultado
      const { data: updatedBriefing } = await supabase
        .from('analise_bench_forms')
        .select('*')
        .eq('id', briefingId)
        .single()
      
      if (updatedBriefing) {
        setSelectedBriefing(updatedBriefing)
      }
      
      setOverlayStatus(null)
      setActiveTab("resultados")
    } catch (error: any) {
      console.error('Erro ao gerar análise:', error)
      setOverlayStatus('error')
      setOverlayError(error?.message || 'Erro desconhecido')
      
      // Reverter status para pending em caso de erro
      await supabase
        .from('analise_bench_forms')
        .update({ status: 'pending' })
        .eq('id', briefingId)
    } finally {
      setIsGeneratingAnalysis(false)
      setGeneratingBriefingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Overlay de geração */}
      {overlayStatus && (
        <CopyGenerationOverlay
          status={overlayStatus}
          title="Gerando análise com IA…"
          successMessage="Análise gerada com sucesso"
          stepMessages={ANALISE_STEP_MESSAGES}
          errorMessage={overlayError}
          onRetry={pendingRetryId ? () => {
            setOverlayStatus(null)
            handleGenerateAnalysis(pendingRetryId)
          } : undefined}
        />
      )}
      {/* Header com título */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análise e Benchmarking</h1>
            <p className="text-muted-foreground">
              Crie briefings de análise competitiva e benchmarking
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo - Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {/* Lado esquerdo - Tabs */}
          <TabsList>
            <TabsTrigger value="formulario" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formulário
            </TabsTrigger>
            
            {canView && (
              <TabsTrigger value="resultados" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Resultados
              </TabsTrigger>
            )}
            
            {canAccessPrompts && (
              <TabsTrigger value="prompts" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Prompts
              </TabsTrigger>
            )}
          </TabsList>

          {/* Lado direito - Seletor de Cliente e Materiais */}
          <div className="flex items-center gap-6">
            {/* Seletor de Cliente - sempre visível */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Cliente: <span className="text-destructive">*</span></span>
              <Select 
                value={selectedClient} 
                onValueChange={(value) => {
                  setSelectedClient(value);
                  form.setValue('client_id', value);
                  form.clearErrors('client_id');
                }}
              >
                <SelectTrigger className={`w-[200px] ${!selectedClient && 'border-destructive'}`}>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {crmClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Container para futuros controles - largura fixa para evitar movimento */}
            <div className="flex items-center gap-3" style={{ width: '500px' }}>
              {/* Espaço reservado para manter alinhamento com Copy */}
            </div>
          </div>
        </div>

        {/* Aba Formulário */}
        <TabsContent value="formulario" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(
              (data) => {
                console.log('✅ Formulário válido, chamando onSubmit:', data);
                
                // Validação extra para garantir que o cliente foi selecionado
                if (!data.client_id || !selectedClient) {
                  toast.error('Por favor, selecione um cliente antes de continuar');
                  return;
                }
                
                onSubmit(data);
              },
              (errors) => {
                console.error('❌ Erros de validação no formulário:', errors);
                
                // Mensagem específica se o cliente não foi selecionado
                if (errors.client_id || !selectedClient) {
                  toast.error('Por favor, selecione um cliente no topo da página');
                } else {
                  toast.error('Preencha todos os campos obrigatórios corretamente');
                }
              }
            )} className="space-y-6">
              {/* Campo oculto para client_id - garante validação correta */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Grid de 3 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Coluna 1: Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Cliente</CardTitle>
                    <CardDescription className="text-xs">descrição (criar)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome_empresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da empresa</FormLabel>
                          <FormDescription className="text-xs">
                            Informe o nome da empresa. EX: Sul solar
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[60px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nicho_empresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nicho da empresa</FormLabel>
                          <FormDescription className="text-xs">
                            Informe o nicho da empresa EX: Energia solar, escritório de investimento, Varejo
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[60px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="site"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site</FormLabel>
                          <FormDescription className="text-xs">
                            Informe o site da empresa
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[60px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicos_produtos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviços/Produtos vendidos</FormLabel>
                          <FormDescription className="text-xs">
                            Descreva o que a empresa vende e como funciona o modelo de negócio
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[80px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="diferenciais_competitivos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principais diferenciais competitivos</FormLabel>
                          <FormDescription className="text-xs">
                            Liste 3-5 diferenciais únicos que você tem e os concorrentes não têm (ou fazem pior)
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[80px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publico_alvo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público-alvo</FormLabel>
                          <FormDescription className="text-xs">
                            Descreva seu cliente ideal (perfil demográfico, poder aquisitivo, cargo, dores principais)
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[80px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objetivo_projeto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principal objetivo/meta do projeto</FormLabel>
                          <FormDescription className="text-xs">
                            (Ex: Vender 3 franquias por mês, Gerar 50 leads B2B qualificados, Aumentar ticket médio)
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[80px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maior_desafio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maior desafio/obstáculo atual</FormLabel>
                          <FormDescription className="text-xs">
                            (Ex: Leads desqualificados, Ciclo de venda longo, Concorrência com preço menor)
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[80px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Coluna 2: Concorrentes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Concorrentes</CardTitle>
                    <CardDescription className="text-xs">descrição (criar)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <FormLabel>Quantos concorrentes deseja analisar?</FormLabel>
                      <Select 
                        value={competitors.length.toString()} 
                        onValueChange={(value) => {
                          const num = parseInt(value)
                          if (num > competitors.length) {
                            // Adicionar concorrentes
                            const newCompetitors = [...competitors]
                            for (let i = competitors.length; i < num; i++) {
                              newCompetitors.push({
                                id: Date.now().toString() + i,
                                nome: '',
                                tipo: 'direto',
                                site: '',
                                instagram_linkedin: '',
                                porque_escolhido: ''
                              })
                            }
                            setCompetitors(newCompetitors)
                          } else {
                            // Remover concorrentes
                            setCompetitors(competitors.slice(0, num))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {competitors.map((competitor, index) => (
                      <div key={competitor.id} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">CONCORRENTE {index + 1}</h4>
                          {competitors.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCompetitor(competitor.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Concorrente</label>
                          <Input
                            value={competitor.nome}
                            onChange={(e) => handleCompetitorChange(competitor.id, 'nome', e.target.value)}
                            placeholder=""
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tipo de concorrente:</label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={competitor.tipo === 'direto' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleCompetitorChange(competitor.id, 'tipo', 'direto')}
                              className={`flex-1 ${competitor.tipo === 'direto' ? 'text-white' : ''}`}
                            >
                              Direto
                            </Button>
                            <Button
                              type="button"
                              variant={competitor.tipo === 'indireto' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleCompetitorChange(competitor.id, 'tipo', 'indireto')}
                              className={`flex-1 ${competitor.tipo === 'indireto' ? 'text-white' : ''}`}
                            >
                              Indireto
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Site</label>
                          <Input
                            value={competitor.site}
                            onChange={(e) => handleCompetitorChange(competitor.id, 'site', e.target.value)}
                            placeholder=""
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Instagram + LinkedIn</label>
                          <Input
                            value={competitor.instagram_linkedin}
                            onChange={(e) => handleCompetitorChange(competitor.id, 'instagram_linkedin', e.target.value)}
                            placeholder=""
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Por que esse concorrente foi escolhido?</label>
                          <p className="text-xs text-muted-foreground">
                            (Ex: Principal player do mercado, Concorrente com mesmo público, Referência em comunicação)
                          </p>
                          <Textarea
                            value={competitor.porque_escolhido}
                            onChange={(e) => handleCompetitorChange(competitor.id, 'porque_escolhido', e.target.value)}
                            placeholder=""
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                      </div>
                    ))}

                    {competitors.length >= 2 && (
                      <p className="text-xs text-muted-foreground italic">
                        (E ASSIM POR DIANTE...)
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Coluna 3: Foco da Análise */}
                <Card>
                  <CardHeader>
                    <CardTitle>Foco da Análise</CardTitle>
                    <CardDescription className="text-xs">descrição (criar)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="objetivo_benchmark"
                      render={() => (
                        <FormItem>
                          <FormLabel>Qual o objetivo principal deste benchmark?</FormLabel>
                          <FormDescription className="text-xs">
                            (Selecione quantas opções quiser)
                          </FormDescription>
                          <div className="space-y-2">
                            {objetivoBenchmarkOptions.map((option) => (
                              <FormField
                                key={option}
                                control={form.control}
                                name="objetivo_benchmark"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value?.includes(option)}
                                          onChange={(e) => {
                                            const checked = e.target.checked
                                            const currentValue = field.value || []
                                            const newValue = checked
                                              ? [...currentValue, option]
                                              : currentValue.filter((value) => value !== option)
                                            field.onChange(newValue)
                                          }}
                                          className="mt-1"
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal leading-tight">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objetivo_benchmark_outro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outro:</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aspecto_prioritario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Existe algum aspecto prioritário para análise?</FormLabel>
                          <FormDescription className="text-xs">
                            Ex: Quero entender como os concorrentes vendem para C-level, Como estruturam os preços nas LPs
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[100px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="informacoes_adicionais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informações adicionais relevantes</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder=""
                              className="min-h-[100px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Botão de Salvar */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  disabled={isLoading || (!permissionsLoading && !canCreate)}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Salvar e gerar análise
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Aba Resultados */}
        <TabsContent value="resultados" className="space-y-6">
          {/* Cards recentes */}
          {briefingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">Nenhuma análise encontrada</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Crie sua primeira análise na aba Formulário</p>
            </div>
          ) : (
            <>
              {/* Cards recentes (últimas 6) */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Análises Recentes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {briefingHistory.slice(0, 6).map((briefing) => (
                    <Card 
                      key={briefing.id} 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 bg-card/80 backdrop-blur-sm border-border/40 hover:border-primary/30 group"
                      onClick={() => setSelectedBriefing(briefing)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant={
                            briefing.status === 'completed' ? 'default' : 
                            briefing.status === 'processing' ? 'secondary' :
                            briefing.status === 'failed' ? 'destructive' :
                            'outline'
                          } className="text-[10px]">
                            {briefing.status === 'completed' ? 'Concluído' : 
                             briefing.status === 'processing' ? 'Processando' :
                             briefing.status === 'failed' ? 'Erro' :
                             'Pendente'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(briefing.created_at), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                          {briefing.nome_empresa || 'Sem nome'}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {briefing.nicho_empresa || 'Nicho não especificado'}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                          <span className="text-[11px] text-muted-foreground">
                            {briefing.profiles?.name || '-'}
                          </span>
                          <div className="flex gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={(e) => { e.stopPropagation(); setSelectedBriefing(briefing); }}
                            >
                              <Eye className="h-3 w-3 mr-1" /> Ver
                            </Button>
                            {briefing.status === 'completed' && canCreate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={(e) => { e.stopPropagation(); handleGenerateAnalysis(briefing.id); }}
                                disabled={isGeneratingAnalysis}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" /> Regenerar
                              </Button>
                            )}
                            {(briefing.status === 'pending' || briefing.status === 'failed') && canCreate && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={(e) => { e.stopPropagation(); handleGenerateAnalysis(briefing.id); }}
                                disabled={isGeneratingAnalysis}
                              >
                                Gerar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Histórico completo em tabela */}
              {briefingHistory.length > 6 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Histórico Completo</h3>
                  <Card className="border-border/40">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nicho</TableHead>
                            <TableHead>Criado por</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {briefingHistory.map((briefing) => (
                            <TableRow key={briefing.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBriefing(briefing)}>
                              <TableCell className="text-sm">
                                {format(new Date(briefing.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium text-sm">{briefing.nome_empresa || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{briefing.nicho_empresa || '-'}</TableCell>
                              <TableCell className="text-sm">{briefing.profiles?.name || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  briefing.status === 'completed' ? 'default' : 
                                  briefing.status === 'processing' ? 'secondary' :
                                  briefing.status === 'failed' ? 'destructive' :
                                  'outline'
                                } className="text-[10px]">
                                  {briefing.status === 'completed' ? 'Concluído' : 
                                   briefing.status === 'processing' ? 'Processando' :
                                   briefing.status === 'failed' ? 'Erro' :
                                   'Pendente'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1.5">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedBriefing(briefing); }}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  {briefing.status === 'completed' && canCreate && (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleGenerateAnalysis(briefing.id); }} disabled={isGeneratingAnalysis}>
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Aba Prompts */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Prompts</CardTitle>
                  <CardDescription>
                    Configure os prompts padrão para geração de análises. Os prompts serão combinados com o briefing do usuário para enviar à API de IA.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreatePrompt(!showCreatePrompt)}
                  variant={showCreatePrompt ? "outline" : "default"}
                  size="sm"
                >
                  {showCreatePrompt ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Prompt
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para criar prompt */}
              {showCreatePrompt && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Novo Prompt</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCreatePrompt(false)
                            setNewPromptTitle('')
                            setNewPromptContent('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Título do prompt"
                          value={newPromptTitle}
                          onChange={(e) => setNewPromptTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Conteúdo do prompt (será combinado com o briefing do usuário)"
                          value={newPromptContent}
                          onChange={(e) => setNewPromptContent(e.target.value)}
                          className="min-h-[150px]"
                        />
                        <Button 
                          onClick={handleCreatePrompt} 
                          disabled={isLoadingPrompts}
                          size="sm"
                        >
                          {isLoadingPrompts ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Salvar Prompt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulário para editar prompt */}
              {editingPrompt && (
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Editar Prompt</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPrompt(null)
                            setNewPromptTitle('')
                            setNewPromptContent('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Título do prompt"
                          value={newPromptTitle}
                          onChange={(e) => setNewPromptTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Conteúdo do prompt"
                          value={newPromptContent}
                          onChange={(e) => setNewPromptContent(e.target.value)}
                          className="min-h-[150px]"
                        />
                        <Button 
                          onClick={() => handleUpdatePrompt(editingPrompt.id, newPromptTitle, newPromptContent)} 
                          disabled={isLoadingPrompts}
                          size="sm"
                        >
                          {isLoadingPrompts ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Settings className="h-4 w-4 mr-2" />
                          )}
                          Atualizar Prompt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de prompts */}
              {isLoadingPrompts && !editingPrompt && !showCreatePrompt ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
                  <p className="text-muted-foreground">Carregando prompts...</p>
                </div>
              ) : defaultPrompts.length === 0 && !showCreatePrompt ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum prompt encontrado</p>
                  <p className="text-sm mt-2">Clique em "Novo Prompt" para criar o primeiro</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {defaultPrompts.map((prompt) => (
                    <Card key={prompt.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const newCollapsed = new Set(collapsedPrompts)
                              if (collapsedPrompts.has(prompt.id)) {
                                newCollapsed.delete(prompt.id)
                              } else {
                                newCollapsed.add(prompt.id)
                              }
                              setCollapsedPrompts(newCollapsed)
                            }}
                            className="flex-1 text-left"
                          >
                            <CardTitle className="text-base hover:text-primary transition-colors">
                              {prompt.title}
                            </CardTitle>
                          </button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newCollapsed = new Set(collapsedPrompts)
                                if (collapsedPrompts.has(prompt.id)) {
                                  newCollapsed.delete(prompt.id)
                                } else {
                                  newCollapsed.add(prompt.id)
                                }
                                setCollapsedPrompts(newCollapsed)
                              }}
                            >
                              {collapsedPrompts.has(prompt.id) ? '▼' : '▲'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPrompt(prompt)
                                setNewPromptTitle(prompt.title)
                                setNewPromptContent(prompt.content)
                                setShowCreatePrompt(false)
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este prompt?')) {
                                  handleDeletePrompt(prompt.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {!collapsedPrompts.has(prompt.id) && (
                        <CardContent>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {prompt.content}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para ver detalhes do briefing */}
      {selectedBriefing && (
        <Dialog open={!!selectedBriefing} onOpenChange={() => setSelectedBriefing(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedBriefing.nome_empresa || 'Detalhes da Análise'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Criado em {format(new Date(selectedBriefing.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {selectedBriefing.profiles?.name && ` por ${selectedBriefing.profiles.name}`}
              </p>
            </DialogHeader>
            
            <div className="space-y-6 py-2">
              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Empresa', value: selectedBriefing.nome_empresa },
                  { label: 'Nicho', value: selectedBriefing.nicho_empresa },
                  { label: 'Site', value: selectedBriefing.site },
                  { label: 'Público-alvo', value: selectedBriefing.publico_alvo },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value || '-'}</p>
                  </div>
                ))}
              </div>

              {/* Concorrentes */}
              {selectedBriefing.competitors && selectedBriefing.competitors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Concorrentes Analisados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedBriefing.competitors.map((comp: any, idx: number) => (
                      <div key={idx} className="border border-border/40 rounded-lg p-3 bg-card/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{comp.nome || `Concorrente ${idx + 1}`}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {comp.tipo === 'direto' ? 'Direto' : 'Indireto'}
                          </Badge>
                        </div>
                        {comp.site && <p className="text-xs text-muted-foreground mt-1">{comp.site}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Análise gerada */}
              {selectedBriefing.ai_response && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Análise Gerada</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedBriefing.ai_response || '')
                          toast.success('Análise copiada para a área de transferência')
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copiar
                      </Button>
                      {canCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedBriefing(null)
                            handleGenerateAnalysis(selectedBriefing.id)
                          }}
                          disabled={isGeneratingAnalysis}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Regenerar
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none bg-muted/30 rounded-xl p-5 border border-border/30">
                    <MarkdownRenderer content={selectedBriefing.ai_response} />
                  </div>
                </div>
              )}

              {selectedBriefing.status === 'pending' && (
                <div className="bg-muted/50 rounded-xl p-6 text-center border border-border/30">
                  <p className="text-sm text-muted-foreground mb-3">
                    Esta análise ainda não foi gerada.
                  </p>
                  {canCreate && (
                    <Button size="sm" onClick={() => { setSelectedBriefing(null); handleGenerateAnalysis(selectedBriefing.id); }}>
                      Gerar Análise
                    </Button>
                  )}
                </div>
              )}

              {selectedBriefing.status === 'failed' && (
                <div className="bg-destructive/10 rounded-xl p-6 text-center border border-destructive/20">
                  <p className="text-sm text-destructive mb-3">
                    Houve um erro ao gerar esta análise.
                  </p>
                  {canCreate && (
                    <Button variant="destructive" size="sm" onClick={() => { setSelectedBriefing(null); handleGenerateAnalysis(selectedBriefing.id); }}>
                      Tentar Novamente
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
