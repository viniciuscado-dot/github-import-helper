import React, { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, FileText, Loader2, ArrowLeft, Eye, Upload, RefreshCw, Send, X, Save, Trash2, Plus, Sparkles, FileUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/external-client"
import { useModulePermissions } from "@/hooks/useModulePermissions"
import { cn } from "@/lib/utils"
import { CopyGenerationOverlay } from '@/components/CopyGenerationOverlay'
import { CopyResultsRecent } from '@/components/copy/CopyResultsRecent'
import { CopyDetailDialog } from '@/components/copy/CopyDetailDialog'
import { CopyHistoryFull } from '@/components/copy/CopyHistoryFull'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { StrategyTimeline, STRATEGY_STAGES } from '@/components/copy/StrategyTimeline'

const PLATFORM_OPTIONS = [
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitter", label: "X (Twitter)" },
]

const TABLES = {
  formsTable: 'test_copy_forms',
  draftsTable: 'test_copy_form_drafts',
}

interface CopyFormRecord {
  id: string
  created_at: string
  created_by: string
  status: string
  nome_empresa?: string
  nomes_empresas?: string
  document_files?: string[]
  ai_response?: string
  ai_provider?: string
  response_generated_at?: string
  copy_type?: string
  profiles?: { name: string; email: string }
}

interface TestCopyBriefingFormProps {
  onBack?: () => void
  clientName?: string
}

export function TestCopyBriefingForm({ onBack, clientName }: TestCopyBriefingFormProps) {
  const { profile } = useAuth()
  const { checkModulePermission } = useModulePermissions()

  // View states
  const [currentView, setCurrentView] = useState<'form' | 'loading'>('form')
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'success' | 'error'>('generating')
  const [generationError, setGenerationError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('form')

  // Timeline / phase
  const [currentPhase, setCurrentPhase] = useState(0)
  const mainTab = STRATEGY_STAGES[currentPhase]?.id ?? 'onboarding'

  // Objective & platforms
  const [projectObjective, setProjectObjective] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // Material types
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>(['criativos', 'roteiro_video', 'landing_page'])

  // Briefing PDF
  const [briefingFile, setBriefingFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Additional info
  const [additionalInfo, setAdditionalInfo] = useState('')

  // History
  const [briefingHistory, setBriefingHistory] = useState<CopyFormRecord[]>([])
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [viewingCopy, setViewingCopy] = useState<CopyFormRecord | null>(null)
  const [viewingBriefing, setViewingBriefing] = useState<any>(null)
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set())
  const fetchSeqRef = useRef(0)

  // New copy modal
  const [showNewCopyModal, setShowNewCopyModal] = useState(false)
  const [selectedBriefingForNewCopy, setSelectedBriefingForNewCopy] = useState<any>(null)
  const [newCopyContext, setNewCopyContext] = useState('')
  const [isGeneratingNewCopy, setIsGeneratingNewCopy] = useState(false)

  // Prompts
  const [defaultPrompts, setDefaultPrompts] = useState<any[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [newPromptTitle, setNewPromptTitle] = useState('')
  const [newPromptContent, setNewPromptContent] = useState('')
  const [collapsedPrompts, setCollapsedPrompts] = useState<Set<string>>(new Set())
  const [showCreatePrompt, setShowCreatePrompt] = useState(false)

  // Config modal
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [analysisInstructions, setAnalysisInstructions] = useState('')
  const [idealResults, setIdealResults] = useState('')

  // Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState('')
  const [showAnalysisResult, setShowAnalysisResult] = useState(false)

  // Permissions
  const canViewHistory = checkModulePermission('copy', 'view')
  const canDeleteCopies = checkModulePermission('copy', 'delete')
  const isAdmin = profile?.effectiveRole === 'admin'
  const canAccessPrompts = isAdmin

  // Load config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('test-copy-analysis-config')
      if (stored) {
        const parsed = JSON.parse(stored)
        setAnalysisInstructions(parsed.instructions || '')
        setIdealResults(parsed.idealResults || '')
      }
    } catch {}
  }, [])

  const handleSaveConfig = () => {
    localStorage.setItem('test-copy-analysis-config', JSON.stringify({
      instructions: analysisInstructions,
      idealResults: idealResults,
    }))
    toast.success('Configurações salvas!')
    setShowConfigModal(false)
  }

  // ── Analyze briefing ──
  const handleAnalyze = async () => {
    if (!briefingFile) { toast.error('Adicione um PDF antes de analisar'); return }
    setIsAnalyzing(true)
    try {
      const { data: authUser } = await supabase.auth.getUser()
      const userId = profile?.user_id ?? authUser?.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Upload PDF temporarily
      const ext = briefingFile.name.split('.').pop()
      const fileName = `analysis_${Math.random().toString(36).substring(2)}_${Date.now()}.${ext}`
      const filePath = `${userId}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('briefing-documents').upload(filePath, briefingFile)
      if (uploadError) throw uploadError

      // Insert a temp record for analysis
      const { data: savedForm, error: saveError } = await supabase
        .from(TABLES.formsTable as any)
        .insert({
          nome_empresa: clientName || 'Análise de Briefing',
          created_by: userId,
          status: 'processing',
          copy_type: 'analysis',
          document_files: [filePath],
          informacao_extra: [
            analysisInstructions ? `=== INSTRUÇÕES DE ANÁLISE ===\n${analysisInstructions}` : '',
            idealResults ? `=== MODELO DE RESULTADOS IDEAIS ===\n${idealResults}` : '',
            additionalInfo ? `=== INFORMAÇÕES ADICIONAIS ===\n${additionalInfo}` : '',
          ].filter(Boolean).join('\n\n') || null,
        })
        .select()
        .single()
      if (saveError) throw saveError

      // Call edge function with analysis-only material type
      const { error: fnError } = await supabase.functions.invoke('generate-copy-ai', {
        body: { copyFormId: savedForm.id, materialTypes: ['analise_briefing'] }
      })
      if (fnError) {
        await supabase.from(TABLES.formsTable as any).update({ status: 'failed' }).eq('id', savedForm.id)
        throw fnError
      }

      // Fetch result
      const { data: result } = await supabase
        .from(TABLES.formsTable as any)
        .select('ai_response')
        .eq('id', savedForm.id)
        .single()

      setAnalysisResult(result?.ai_response || 'Sem resultado disponível.')
      setShowAnalysisResult(true)
    } catch (err: any) {
      console.error('Erro na análise:', err)
      toast.error(err?.message || 'Erro ao analisar briefing')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Fetch history ──
  const fetchBriefingHistory = useCallback(async () => {
    if (!canViewHistory) return
    const seq = ++fetchSeqRef.current
    const tabAtRequest = mainTab
    try {
      let query = supabase
        .from(TABLES.formsTable as any)
        .select('id, created_at, created_by, status, nome_empresa, nomes_empresas, document_files, ai_response, ai_provider, response_generated_at, copy_type')
        .eq('copy_type', tabAtRequest)
        .order('created_at', { ascending: false })
      if (clientName) query = query.eq('nome_empresa', clientName)
      const { data, error } = await query
      if (error) throw error
      if (seq !== fetchSeqRef.current || tabAtRequest !== mainTab) return
      const withProfiles = await Promise.all(
        (data || []).map(async (b) => {
          const { data: p } = await supabase.from('profiles').select('name, email').eq('id', b.created_by).single()
          return { ...b, profiles: p || { name: 'Usuário desconhecido', email: '' } }
        })
      )
      if (seq !== fetchSeqRef.current || tabAtRequest !== mainTab) return
      setBriefingHistory(withProfiles)
    } catch (e) { console.error('Erro ao buscar histórico:', e) }
  }, [canViewHistory, mainTab, clientName])

  // ── Fetch prompts ──
  const fetchDefaultPrompts = useCallback(async () => {
    if (!canAccessPrompts) return
    setIsLoadingPrompts(true)
    try {
      const { data, error } = await supabase
        .from('default_prompts')
        .select('*')
        .eq('is_active', true)
        .eq('copy_type', mainTab === 'onboarding' ? 'onboarding' : 'ongoing')
        .order('position', { ascending: true })
      if (error) throw error
      setDefaultPrompts(data || [])
    } catch (e) { console.error('Erro ao buscar prompts:', e) }
    finally { setIsLoadingPrompts(false) }
  }, [canAccessPrompts, mainTab])

  useEffect(() => {
    setBriefingHistory([])
    setDefaultPrompts([])
    setViewingCopy(null)
    if (canViewHistory) fetchBriefingHistory()
    if (canAccessPrompts) fetchDefaultPrompts()
  }, [canViewHistory, canAccessPrompts, mainTab])

  // ── Prompt CRUD ──
  const handleCreatePrompt = async () => {
    if (!newPromptTitle.trim() || !newPromptContent.trim()) { toast.error("Título e conteúdo são obrigatórios"); return }
    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase.from('default_prompts').insert({
        title: newPromptTitle, content: newPromptContent, created_by: profile?.user_id,
        position: defaultPrompts.length, copy_type: mainTab === 'onboarding' ? 'onboarding' : 'ongoing', is_active: true,
      })
      if (error) throw error
      toast.success("Prompt criado!"); setNewPromptTitle(''); setNewPromptContent(''); setShowCreatePrompt(false); fetchDefaultPrompts()
    } catch { toast.error("Erro ao criar prompt") }
    finally { setIsLoadingPrompts(false) }
  }

  const handleUpdatePrompt = async (id: string, title: string, content: string) => {
    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase.from('default_prompts').update({ title, content }).eq('id', id)
      if (error) throw error
      toast.success("Prompt atualizado!"); setEditingPrompt(null); fetchDefaultPrompts()
    } catch { toast.error("Erro ao atualizar prompt") }
    finally { setIsLoadingPrompts(false) }
  }

  const handleDeletePrompt = async (id: string) => {
    setIsLoadingPrompts(true)
    try {
      const { error } = await supabase.from('default_prompts').update({ is_active: false }).eq('id', id)
      if (error) throw error
      toast.success("Prompt removido!"); fetchDefaultPrompts()
    } catch { toast.error("Erro ao remover prompt") }
    finally { setIsLoadingPrompts(false) }
  }

  // ── Delete copy ──
  const handleDeleteCopy = async (copyId: string) => {
    try {
      const { error } = await supabase.from(TABLES.formsTable as any).delete().eq('id', copyId)
      if (error) throw error
      toast.success("Copy excluída!"); fetchBriefingHistory(); setViewingCopy(null)
    } catch { toast.error("Erro ao excluir copy") }
  }

  // ── Generate new copy version ──
  const handleGenerateNewCopy = async () => {
    if (!selectedBriefingForNewCopy || !newCopyContext.trim()) { toast.error("Contexto é obrigatório"); return }
    setIsGeneratingNewCopy(true)
    try {
      const { error } = await supabase.functions.invoke('generate-copy-ai', {
        body: { copyFormId: selectedBriefingForNewCopy.id, newCopyContext, appendToExisting: true, materialTypes: selectedMaterialTypes }
      })
      if (error) throw error
      toast.success("Nova versão criada!"); setShowNewCopyModal(false); setNewCopyContext(''); setSelectedBriefingForNewCopy(null); fetchBriefingHistory()
    } catch { toast.error("Erro ao gerar nova copy") }
    finally { setIsGeneratingNewCopy(false) }
  }

  // ── File drag/drop ──
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') { setBriefingFile(file); toast.success(`PDF "${file.name}" adicionado`) }
    else toast.error("Apenas arquivos PDF são aceitos")
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') { setBriefingFile(file); toast.success(`PDF "${file.name}" adicionado`) }
    else if (file) toast.error("Apenas arquivos PDF são aceitos")
  }

  // ── Submit (upload PDF + generate) ──
  const handleSubmit = async () => {
    if (!briefingFile) { toast.error("Adicione um PDF de briefing"); return }
    if (selectedMaterialTypes.length === 0) { toast.error("Selecione pelo menos um tipo de material"); return }

    setIsLoading(true); setGenerationStatus('generating'); setGenerationError(undefined); setCurrentView('loading')

    try {
      const { data: authUser } = await supabase.auth.getUser()
      const createdBy = profile?.user_id ?? authUser?.user?.id
      if (!createdBy) throw new Error('Usuário não autenticado')

      // Upload PDF
      const ext = briefingFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${ext}`
      const filePath = `${createdBy}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('briefing-documents').upload(filePath, briefingFile)
      if (uploadError) throw uploadError

      // Insert record
      const { data: savedForm, error: saveError } = await supabase
        .from(TABLES.formsTable as any)
        .insert({
          nome_empresa: clientName || 'Briefing PDF',
          created_by: createdBy,
          status: 'processing',
          copy_type: mainTab,
          document_files: [filePath],
          informacao_extra: additionalInfo || null,
        })
        .select()
        .single()
      if (saveError) throw saveError

      // Call edge function
      const { error: fnError } = await supabase.functions.invoke('generate-copy-ai', {
        body: { copyFormId: savedForm.id, materialTypes: selectedMaterialTypes }
      })
      if (fnError) {
        await supabase.from(TABLES.formsTable as any).update({ status: 'failed' }).eq('id', savedForm.id)
        throw fnError
      }

      setGenerationStatus('success')
      setTimeout(async () => {
        toast.success('Briefing analisado e materiais gerados!')
        setBriefingFile(null)
        setAdditionalInfo('')
        if (canViewHistory) await fetchBriefingHistory()
        setCurrentView('form'); setIsLoading(false); setActiveTab('history')
        // Auto-open
        const { data: fresh } = await supabase
          .from(TABLES.formsTable as any)
          .select('id, created_at, created_by, status, nome_empresa, nomes_empresas, document_files, ai_response, ai_provider, response_generated_at, copy_type')
          .eq('id', savedForm.id).single()
        if (fresh) {
          const { data: pd } = await supabase.from('profiles').select('name, email').eq('id', fresh.created_by).single()
          setViewingCopy({ ...fresh, profiles: pd || { name: 'Usuário desconhecido', email: '' } })
        }
      }, 1500)
    } catch (error: any) {
      console.error('Erro:', error)
      setGenerationStatus('error'); setGenerationError(error?.message || 'Erro ao processar briefing'); setIsLoading(false)
    }
  }

  const handleRetry = () => { handleSubmit() }

  // ── Render ──
  if (currentView === 'loading') {
    return <CopyGenerationOverlay status={generationStatus} onRetry={handleRetry} errorMessage={generationError} />
  }

  return (
    <div>
      {/* Static header */}
      <div className="space-y-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/teste-copy'} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Briefing</h1>
          {clientName && (
            <p className="text-muted-foreground text-sm mt-0.5">
              Cliente: <span className="font-medium text-foreground">{clientName}</span>
            </p>
          )}
        </div>

        {/* Objetivo + Plataformas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="objetivo-projeto" className="text-sm font-medium text-foreground">Objetivo do projeto</label>
            <Textarea
              id="objetivo-projeto"
              placeholder="Ex: Gerar leads qualificados para consultoria financeira..."
              value={projectObjective}
              onChange={(e) => setProjectObjective(e.target.value)}
              className="min-h-[72px] resize-none bg-muted/30 border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Plataformas de anúncio</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border/50 bg-muted/30 min-h-[72px] items-start content-start">
              {PLATFORM_OPTIONS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.value)
                return (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => setSelectedPlatforms(prev => isSelected ? prev.filter(p => p !== platform.value) : [...prev, platform.value])}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary/50 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {platform.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <StrategyTimeline currentStage={currentPhase} onStageClick={setCurrentPhase} />
      </div>

      {/* Tabs + material selector */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Briefing
            </TabsTrigger>
            {canViewHistory && (
              <TabsTrigger value="history" className="flex items-center gap-2">
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Gerar:</span>
            {[
              { value: 'criativos', label: 'Criativos' },
              { value: 'roteiro_video', label: 'Roteiros de Vídeo' },
              { value: 'landing_page', label: 'Landing Page' },
            ].map((mat) => {
              const isSelected = selectedMaterialTypes.includes(mat.value)
              return (
                <button
                  key={mat.value}
                  type="button"
                  onClick={() => setSelectedMaterialTypes(prev => isSelected ? prev.filter(m => m !== mat.value) : [...prev, mat.value])}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary/50 shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {mat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Briefing Tab ─── */}
        <TabsContent value="form" className="space-y-6">
          {/* PDF Upload Area */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileUp className="h-5 w-5" />
                  Analisador de Briefing
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={!briefingFile || isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                    Analisar Informações
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowConfigModal(true)} className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Adicione o PDF do briefing. A inteligência artificial irá analisar o documento e gerar os materiais com base nas orientações dos prompts configurados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : briefingFile
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {briefingFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{briefingFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(briefingFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setBriefingFile(null) }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Arraste o PDF do briefing aqui</p>
                      <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar o arquivo</p>
                    </div>
                    <Badge variant="secondary" className="mt-1">Apenas PDF</Badge>
                  </div>
                )}
              </div>

              {/* Additional info */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Informações adicionais</label>
                <Textarea
                  placeholder="Adicione informações complementares que não estão no briefing, como contexto extra, observações ou instruções específicas..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="min-h-[120px] resize-y bg-muted/30 border-border/50 focus:border-primary/50"
                />
              </div>

              {/* Generate button */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !briefingFile}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Gerar Materiais
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Resultados Tab ─── */}
        {canViewHistory && (
          <TabsContent value="history" className="space-y-6 w-full">
            {showFullHistory ? (
              <CopyHistoryFull
                briefings={briefingHistory}
                onBack={() => setShowFullHistory(false)}
                onView={(b) => setViewingCopy(b)}
                onViewBriefing={async (b) => {
                  const { data, error } = await supabase.from(TABLES.formsTable as any).select('*').eq('id', b.id).single()
                  if (!error && data) setViewingBriefing(data)
                  else toast.error('Erro ao carregar briefing')
                }}
                onNewVersion={(b) => { setSelectedBriefingForNewCopy(b); setShowNewCopyModal(true) }}
                onDelete={handleDeleteCopy}
                onRefresh={fetchBriefingHistory}
                canDelete={canDeleteCopies}
              />
            ) : (
              <CopyResultsRecent
                briefings={briefingHistory}
                onView={(b) => setViewingCopy(b)}
                onViewHistory={() => setShowFullHistory(true)}
                isEmpty={briefingHistory.length === 0}
              />
            )}
          </TabsContent>
        )}

        {/* ─── Prompts Tab ─── */}
        {canAccessPrompts && (
          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prompts Padrão</CardTitle>
                    <CardDescription>Gerencie os prompts padrão usados na geração de copies</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowCreatePrompt(!showCreatePrompt)} variant="default" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar novo prompt
                    </Button>
                    <Button onClick={fetchDefaultPrompts} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showCreatePrompt && (
                  <div className="p-4 border border-dashed rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Criar Novo Prompt</h3>
                      <Button variant="ghost" size="sm" onClick={() => { setShowCreatePrompt(false); setNewPromptTitle(''); setNewPromptContent('') }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <Input placeholder="Título do prompt" value={newPromptTitle} onChange={(e) => setNewPromptTitle(e.target.value)} />
                      <Textarea placeholder="Conteúdo do prompt" value={newPromptContent} onChange={(e) => setNewPromptContent(e.target.value)} className="min-h-[100px]" />
                      <Button onClick={handleCreatePrompt} disabled={isLoadingPrompts} size="sm">
                        {isLoadingPrompts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar Prompt
                      </Button>
                    </div>
                  </div>
                )}

                {isLoadingPrompts ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
                    <p className="text-muted-foreground">Carregando prompts...</p>
                  </div>
                ) : defaultPrompts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum prompt encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {defaultPrompts.map((prompt) => (
                      <Card key={prompt.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <button type="button" onClick={() => {
                              const s = new Set(collapsedPrompts)
                              collapsedPrompts.has(prompt.id) ? s.delete(prompt.id) : s.add(prompt.id)
                              setCollapsedPrompts(s)
                            }} className="flex-1 text-left">
                              <CardTitle className="text-base hover:text-primary transition-colors">{prompt.title}</CardTitle>
                            </button>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => {
                                const s = new Set(collapsedPrompts)
                                collapsedPrompts.has(prompt.id) ? s.delete(prompt.id) : s.add(prompt.id)
                                setCollapsedPrompts(s)
                              }}><Eye className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditingPrompt(prompt); setNewPromptTitle(prompt.title); setNewPromptContent(prompt.content) }}>
                                <Settings className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button size="sm" variant="outline"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Prompt</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePrompt(prompt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        {!collapsedPrompts.has(prompt.id) && (
                          <CardContent><MarkdownRenderer content={prompt.content} /></CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Copy detail dialog */}
      <CopyDetailDialog
        copy={viewingCopy}
        open={!!viewingCopy}
        onOpenChange={() => setViewingCopy(null)}
        onRegenerate={async (copyId, instruction) => {
          try {
            const { error } = await supabase.functions.invoke('generate-copy-ai', {
              body: { copyFormId: copyId, newCopyContext: instruction, appendToExisting: true, materialTypes: selectedMaterialTypes }
            })
            if (error) throw error
            toast.success("Nova versão gerada!"); fetchBriefingHistory()
            const { data: updated } = await supabase.from(TABLES.formsTable as any).select('*').eq('id', copyId).single()
            if (updated) {
              const { data: pd } = await supabase.from('profiles').select('name, email').eq('id', updated.created_by).single()
              setViewingCopy({ ...updated, profiles: pd || { name: 'Usuário desconhecido', email: '' } })
            }
          } catch (e) { console.error(e); toast.error("Erro ao gerar nova versão"); throw e }
        }}
      />

      {/* Edit prompt dialog */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="max-w-screen-2xl max-h-screen h-screen w-screen m-0 rounded-none overflow-hidden p-6">
          <div className="flex flex-col h-full space-y-3">
            <DialogHeader className="pb-2"><DialogTitle className="text-lg">Editar Prompt</DialogTitle></DialogHeader>
            <Input placeholder="Título do prompt" value={newPromptTitle} onChange={(e) => setNewPromptTitle(e.target.value)} className="shrink-0" />
            <Textarea placeholder="Conteúdo do prompt" value={newPromptContent} onChange={(e) => setNewPromptContent(e.target.value)} className="flex-1 min-h-0 resize-none" />
            <div className="flex gap-2 justify-end shrink-0 pt-2">
              <Button variant="outline" onClick={() => setEditingPrompt(null)}>Cancelar</Button>
              <Button onClick={() => handleUpdatePrompt(editingPrompt.id, newPromptTitle, newPromptContent)} disabled={isLoadingPrompts}>
                {isLoadingPrompts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New copy version dialog */}
      <Dialog open={showNewCopyModal} onOpenChange={setShowNewCopyModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova versão de copy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Contexto para nova copy (obrigatório)</label>
              <Textarea placeholder="Descreva o motivo..." value={newCopyContext} onChange={(e) => setNewCopyContext(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewCopyModal(false)}>Cancelar</Button>
              <Button onClick={handleGenerateNewCopy} disabled={isGeneratingNewCopy || !newCopyContext.trim()}>
                {isGeneratingNewCopy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Nova versão de copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Briefing detail dialog */}
      <Dialog open={!!viewingBriefing} onOpenChange={() => { setViewingBriefing(null); setExpandedMeetings(new Set()) }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Briefing - {viewingBriefing?.nome_empresa || 'Sem nome'}</DialogTitle>
          </DialogHeader>
          {viewingBriefing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b">
                <div><span className="font-medium">Criado em:</span> {new Date(viewingBriefing.created_at).toLocaleString('pt-BR')}</div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge className="ml-2" variant={viewingBriefing.status === 'completed' ? 'default' : viewingBriefing.status === 'processing' ? 'secondary' : 'destructive'}>
                    {viewingBriefing.status === 'completed' ? 'Concluído' : viewingBriefing.status === 'processing' ? 'Processando' : 'Erro'}
                  </Badge>
                </div>
              </div>
              {viewingBriefing.document_files && Array.isArray(viewingBriefing.document_files) && viewingBriefing.document_files.length > 0 && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">Documentos anexados</h3>
                  {viewingBriefing.document_files.map((f: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">{f.split('/').pop()}</p>
                  ))}
                </div>
              )}
              {viewingBriefing.informacao_extra && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">Informações adicionais</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingBriefing.informacao_extra}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Análise
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Instruções de Análise</label>
              <p className="text-xs text-muted-foreground">Defina como a IA deve avaliar o briefing. Essas instruções serão usadas ao clicar em "Analisar Informações".</p>
              <Textarea
                placeholder="Ex: Avalie se o briefing contém informações completas sobre público-alvo, objetivos, tom de voz, diferenciais competitivos..."
                value={analysisInstructions}
                onChange={(e) => setAnalysisInstructions(e.target.value)}
                className="min-h-[180px] resize-y bg-muted/30 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Modelo de Resultados Ideais</label>
              <p className="text-xs text-muted-foreground">Descreva o que um briefing completo deve conter. A IA usará isso como referência para avaliar a completude.</p>
              <Textarea
                placeholder="Ex: Um briefing completo deve conter: 1) Nome da empresa e nicho. 2) Público-alvo detalhado. 3) Produtos/serviços..."
                value={idealResults}
                onChange={(e) => setIdealResults(e.target.value)}
                className="min-h-[180px] resize-y bg-muted/30 border-border/50"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveConfig} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Result Modal */}
      <Dialog open={showAnalysisResult} onOpenChange={setShowAnalysisResult}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Resultado da Análise
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <MarkdownRenderer content={analysisResult} className="prose-sm" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
