import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CANDIDATE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-1-20250805',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
] as const;

const ANALYSIS_BRIEFING_TYPE = 'analise_briefing' as const;
const MATERIAL_ORDER = ['criativos', 'roteiro_video', 'landing_page'] as const;

type MaterialType = (typeof MATERIAL_ORDER)[number];
type PromptRow = { title: string; content: string };

const MATERIAL_LABELS: Record<MaterialType, string> = {
  criativos: 'Criativos Estáticos (headlines, textos para anúncios, copies de criativos)',
  roteiro_video: 'Roteiros de Vídeo (scripts, storyboards, roteiros completos)',
  landing_page: 'Landing Page (copy completa para página de vendas/captura)',
};

function isMaterialType(value: unknown): value is MaterialType {
  return MATERIAL_ORDER.some((type) => type === value);
}

function isBriefingAnalysisRequested(materialTypes: unknown): boolean {
  return Array.isArray(materialTypes) && materialTypes.includes(ANALYSIS_BRIEFING_TYPE);
}

function normalizeMaterialTypes(materialTypes: unknown): MaterialType[] {
  if (!Array.isArray(materialTypes) || materialTypes.length === 0) {
    return [...MATERIAL_ORDER];
  }

  return materialTypes.filter(isMaterialType);
}

function getCompanyName(companyName: string | null | undefined): string {
  return (companyName || 'CLIENTE').trim().toUpperCase();
}

function getMaterialHeading(materialType: MaterialType, companyName: string | null | undefined): string {
  const formattedCompany = getCompanyName(companyName);

  switch (materialType) {
    case 'criativos':
      return `# CRIATIVOS ESTÁTICOS - ${formattedCompany}`;
    case 'roteiro_video':
      return `# ROTEIROS DE VÍDEO - ${formattedCompany}`;
    case 'landing_page':
      return `# LANDING PAGE - ${formattedCompany}`;
  }
}

function ensureMaterialHeading(
  materialType: MaterialType,
  companyName: string | null | undefined,
  text: string,
): string {
  const heading = getMaterialHeading(materialType, companyName);
  const trimmed = text.trim();

  if (trimmed.toUpperCase().startsWith(heading.toUpperCase())) {
    return trimmed;
  }

  return `${heading}\n\n${trimmed}`;
}

function getLandingPageMinLength(size: string | null | undefined): number {
  const normalized = (size || '').toLowerCase();

  if (/extens|longa|grande/.test(normalized)) return 3500;
  if (/m[eé]dia/.test(normalized)) return 2200;
  if (/curta|curto|objetiva|pequena/.test(normalized)) return 1200;
  return 1800;
}

function getMaterialMinLength(materialType: MaterialType, landingPageSize: string | null | undefined): number {
  switch (materialType) {
    case 'criativos':
      return 1500;
    case 'roteiro_video':
      return 1200;
    case 'landing_page':
      return getLandingPageMinLength(landingPageSize);
  }
}

function isMaterialOutputValid(
  materialType: MaterialType,
  text: string,
  companyName: string | null | undefined,
  landingPageSize: string | null | undefined,
): boolean {
  const normalizedText = ensureMaterialHeading(materialType, companyName, text);

  if (normalizedText.length < getMaterialMinLength(materialType, landingPageSize)) {
    return false;
  }

  switch (materialType) {
    case 'criativos':
      return /CRIATIVOS|HEADLINE/i.test(normalizedText) && /CTA/i.test(normalizedText) && (normalizedText.match(/HEADLINE/gi)?.length || 0) >= 3;
    case 'roteiro_video':
      return /ROTEIRO|CENA|GANCHO|HOOK/i.test(normalizedText) && /CTA|CHAMADA/i.test(normalizedText);
    case 'landing_page':
      return /LANDING PAGE|HEADLINE|SUBHEADLINE|CTA/i.test(normalizedText) && /OBRIGADO|P[ÁA]GINA DE OBRIGADO|FAQ|BENEF[ÍI]CIO|SEÇÃO|DOBRA/i.test(normalizedText);
  }
}

function buildSystemPrompt(prompts: PromptRow[], documentsContent: string): string {
  const promptInstructions = prompts.length > 0
    ? `=== INSTRUÇÕES OBRIGATÓRIAS ===
VOCÊ DEVE seguir EXATAMENTE o formato, estrutura e estilo dos exemplos fornecidos abaixo.
NÃO invente seções novas. Use as MESMAS seções, cabeçalhos e nível de detalhe dos exemplos.
Cada prompt abaixo contém instruções e/ou exemplos que devem ser seguidos rigorosamente.
================================

${prompts.map((p, idx) => `=== PROMPT ${idx + 1}: ${p.title} ===\n${p.content}\n=== FIM PROMPT ${idx + 1} ===`).join('\n\n')}`
    : 'Você é um copywriter sênior especializado em copys de alta conversão.';

  return `${promptInstructions}

=== REGRAS FIXAS DE SAÍDA ===
- Responda sempre em Markdown puro.
- Nunca gere HTML, CSS ou JavaScript.
- Nunca entregue conteúdo parcial, resumido ou abreviado quando houver estrutura de exemplo para seguir.
- Preserve a mesma profundidade, riqueza de detalhes, seções, subtítulos, bullets, CTAs, blocos, cenas e páginas auxiliares dos exemplos relevantes.
- Quando esta chamada pedir apenas um tipo de material, gere SOMENTE esse tipo de material.
- Se houver conflito entre brevidade e completude, priorize completude.

${documentsContent ? `=== CONTEXTO ADICIONAL DOS DOCUMENTOS ===
${documentsContent}

IMPORTANTE: Use as informações dos documentos acima para enriquecer a análise e personalizar o material final com dados e diferenciais concretos.

===========================` : ''}`;
}

function buildBriefingAnalysisSystemPrompt(): string {
  return `Você é um analista sênior de briefing da DOT, especializado em avaliar a completude e a qualidade estratégica de documentos de briefing.

=== FORMATO OBRIGATÓRIO DE RESPOSTA ===
- A PRIMEIRA LINHA deve ser exatamente: SCORE: XX/100
- XX deve ser um número inteiro entre 0 e 100.
- Depois do score, responda em Markdown puro com as seções abaixo, nesta ordem:
  ## Diagnóstico Geral
  ## Pontos Fortes
  ## Lacunas Críticas
  ## Informações Faltantes
  ## Recomendações Práticas
  ## Veredito Final

=== REGRAS FIXAS ===
- Não gere criativos, roteiros, landing page ou qualquer material de campanha.
- Use o conteúdo do PDF como base principal.
- Leve em consideração todas as instruções, modelos ideais e observações adicionais enviados no contexto.
- A nota deve refletir o quanto o briefing está completo, claro, acionável e pronto para geração de materiais.
- Seja específico sobre o que foi encontrado, o que está ausente e o que precisa ser complementado.
- Nunca responda com HTML, CSS ou JavaScript.`;
}

function buildBriefingAnalysisUserMessage(formData: any, documentsContent: string): string {
  return `=== OBJETIVO ===
Avalie o briefing anexado e retorne uma nota visual de completude junto com feedback detalhado.

=== CONTEXTO DO CLIENTE ===
- Empresa: ${formData.nome_empresa || 'Não informado'}
- Fase/Copy type: ${formData.copy_type || 'Não informado'}

=== INSTRUÇÕES, CRITÉRIOS E MODELOS CONFIGURADOS PELO USUÁRIO ===
${formData.informacao_extra || 'Nenhuma instrução adicional foi fornecida.'}

=== CONTEÚDO EXTRAÍDO DO PDF ===
${documentsContent || 'Nenhum conteúdo textual pôde ser extraído do PDF.'}

Agora faça a análise completa do briefing seguindo exatamente o formato obrigatório.`;
}

function isBriefingAnalysisOutputValid(text: string): boolean {
  const scoreMatch = text.match(/SCORE:\s*(\d{1,3})\s*\/\s*100/i);
  if (!scoreMatch) return false;

  const score = Number(scoreMatch[1]);
  if (!Number.isInteger(score) || score < 0 || score > 100) return false;

  return /##\s*Diagn[oó]stico\s*Geral/i.test(text)
    && /##\s*Pontos\s*Fortes/i.test(text)
    && /##\s*Lacunas\s*Cr[ií]ticas/i.test(text)
    && /##\s*Informa[cç][õo]es\s*Faltantes/i.test(text)
    && /##\s*Recomenda[cç][õo]es\s*Pr[aá]ticas/i.test(text)
    && /##\s*Veredito\s*Final/i.test(text)
    && text.trim().length >= 400;
}

function buildClientContext(formData: any, newCopyContext?: string): string {
  return `${newCopyContext ? `=== SOLICITAÇÃO DE NOVA COPY ===
MOTIVO/CONTEXTO: ${newCopyContext}

O cliente já recebeu uma copy anteriormente e agora está solicitando uma NOVA versão considerando o contexto acima.
Use TODAS as informações do briefing abaixo para gerar uma copy completamente nova e adequada ao novo contexto.

===========================

` : ''}INFORMAÇÕES DO CLIENTE ATUAL:

REUNIÕES:
- Reunião de Boas-vindas: ${formData.reuniao_boas_vindas || 'Não informado'}
- Reunião de Kick-off: ${formData.reuniao_kick_off || 'Não informado'}
- Reunião de Brainstorm: ${formData.reuniao_brainstorm || 'Não informado'}

DADOS DO NEGÓCIO:
- Empresa: ${formData.nome_empresa || 'Não informado'}
- Nicho: ${formData.nicho_empresa || 'Não informado'}
- Site: ${formData.site || 'Não informado'}
- Serviços/Produtos: ${formData.servicos_produtos || 'Não informado'}
- Diferencial: ${formData.diferencial_competitivo || 'Não informado'}
- Público-alvo: ${formData.publico_alvo || 'Não informado'}
- Principal obstáculo: ${formData.principal_inimigo || 'Não informado'}
- Avatar: ${formData.avatar_principal || 'Não informado'}
- Momento da jornada: ${formData.momento_jornada || 'Não informado'}
- Maior objeção: ${formData.maior_objecao || 'Não informado'}
- Cases: ${formData.cases_impressionantes || 'Não informado'}
- Empresas atendidas: ${formData.nomes_empresas || 'Não informado'}
- Investimento médio: ${formData.investimento_medio || 'Não informado'}
- Qualificação: ${formData.pergunta_qualificatoria || 'Não informado'}
- Informações extras: ${formData.informacao_extra || 'Não informado'}
- Números/Certificados: ${formData.numeros_certificados || 'Não informado'}
- Tamanho da LP solicitado: ${formData.tamanho_lp || 'Não especificado'}
- Fase do projeto/copy type: ${formData.copy_type || 'Não informado'}`;
}

function buildMaterialSpecificInstruction(materialType: MaterialType, formData: any): string {
  switch (materialType) {
    case 'criativos':
      return 'Gere exclusivamente os CRIATIVOS ESTÁTICOS completos. Entregue todos os blocos necessários com personas/públicos, ganchos, headline, subheadline, bullets e CTA. Não gere roteiros de vídeo nem landing page.';
    case 'roteiro_video':
      return 'Gere exclusivamente os ROTEIROS DE VÍDEO completos. Entregue roteiros completos, sem resumir cenas, hooks/ganchos, desenvolvimento, fechamento e CTA. Não gere criativos estáticos nem landing page.';
    case 'landing_page':
      return `Gere exclusivamente a LANDING PAGE completa, respeitando o tamanho solicitado (${formData.tamanho_lp || 'Não especificado'}), e inclua a PÁGINA DE OBRIGADO seguindo o padrão dos exemplos ativos. Não gere criativos estáticos nem roteiros de vídeo.`;
  }
}

function buildMaterialChecklist(materialType: MaterialType): string {
  switch (materialType) {
    case 'criativos':
      return '- Não omita personas, ganchos, headlines, subheadlines, bullets ou CTAs.';
    case 'roteiro_video':
      return '- Não omita hook/gancho, cenas/blocos, desenvolvimento, fechamento e CTA.';
    case 'landing_page':
      return '- Não omita hero section, seções intermediárias, prova, objeções, CTA final, FAQ e página de obrigado quando o padrão ativo exigir.';
  }
}

function buildMaterialUserMessage(
  materialType: MaterialType,
  formData: any,
  clientContext: string,
  retryMode = false,
): string {
  return `=== MATERIAL A GERAR AGORA ===
Tipo solicitado: ${MATERIAL_LABELS[materialType]}

=== TÍTULO OBRIGATÓRIO DE ABERTURA ===
Comece exatamente com:
${getMaterialHeading(materialType, formData.nome_empresa)}

${buildMaterialSpecificInstruction(materialType, formData)}

=== REGRAS OBRIGATÓRIAS DE EXECUÇÃO ===
- Responda somente com o material final em Markdown puro.
- Gere APENAS este material nesta chamada.
- Siga exatamente a estrutura, ordem, profundidade e estilo dos exemplos relevantes.
- Não resuma, não simplifique e não encerre antes do material estar completo.
${buildMaterialChecklist(materialType)}
- Finalize somente quando este material estiver integralmente concluído.
${retryMode ? '- ATENÇÃO MÁXIMA: a tentativa anterior veio parcial ou insuficiente. Refaça com estrutura completa, sem omitir nenhum bloco obrigatório.' : ''}

${clientContext}

Agora gere o material completo.`;
}

function extractAnthropicText(data: any): string {
  if (!Array.isArray(data?.content)) return '';

  return data.content
    .filter((item: any) => item?.type === 'text' && typeof item?.text === 'string')
    .map((item: any) => item.text)
    .join('\n')
    .trim();
}

async function callAnthropicWithFallback(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens = 8192,
): Promise<{ model: string; text: string; stopReason?: string }> {
  let lastErrorText = '';

  for (const model of CANDIDATE_MODELS) {
    console.log('🧪 Tentando modelo:', model);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [
          { role: 'user', content: [{ type: 'text', text: userMessage }] },
        ],
      }),
    });

    console.log('📡 Status do modelo', model, ':', resp.status);

    if (!resp.ok) {
      lastErrorText = await resp.text();
      console.error('❌ Erro com modelo', model, ':', lastErrorText);
      continue;
    }

    const data = await resp.json();
    const text = extractAnthropicText(data);
    const stopReason = typeof data?.stop_reason === 'string' ? data.stop_reason : undefined;

    console.log('✅ Modelo aceito:', model, 'stop_reason:', stopReason || 'n/a');

    if (!text) {
      lastErrorText = `Resposta vazia do modelo ${model}`;
      console.error('❌ Resposta vazia do modelo', model);
      continue;
    }

    return { model, text, stopReason };
  }

  throw new Error(`Nenhum modelo Anthropic aceitou a requisição. Último erro: ${lastErrorText}`);
}

async function generateMaterialBlock(params: {
  apiKey: string;
  formData: any;
  clientContext: string;
  fullSystemPrompt: string;
  materialType: MaterialType;
}): Promise<string> {
  const { apiKey, formData, clientContext, fullSystemPrompt, materialType } = params;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const retryMode = attempt > 0;

    try {
      const userMessage = buildMaterialUserMessage(materialType, formData, clientContext, retryMode);
      const { text, model, stopReason } = await callAnthropicWithFallback(apiKey, fullSystemPrompt, userMessage);
      const normalizedText = ensureMaterialHeading(materialType, formData.nome_empresa, text);

      console.log(`📝 ${materialType} gerado com ${normalizedText.length} caracteres via ${model}`);

      if (stopReason !== 'max_tokens' && isMaterialOutputValid(materialType, normalizedText, formData.nome_empresa, formData.tamanho_lp)) {
        return normalizedText;
      }

      console.warn(`⚠️ ${materialType} retornou potencialmente incompleto. stop_reason=${stopReason || 'n/a'} tamanho=${normalizedText.length} tentativa=${attempt + 1}`);
      lastError = new Error(`Saída potencialmente incompleta para ${materialType}`);
    } catch (error) {
      lastError = error;
      console.error(`❌ Erro ao gerar ${materialType} na tentativa ${attempt + 1}:`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Não foi possível gerar o bloco completo de ${MATERIAL_LABELS[materialType]}.`);
}

async function generateBriefingAnalysis(params: {
  apiKey: string;
  formData: any;
  documentsContent: string;
}): Promise<string> {
  const { apiKey, formData, documentsContent } = params;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text, model, stopReason } = await callAnthropicWithFallback(
        apiKey,
        buildBriefingAnalysisSystemPrompt(),
        buildBriefingAnalysisUserMessage(formData, documentsContent),
        4096,
      );

      console.log(`🧠 análise_briefing gerado com ${text.length} caracteres via ${model}`);

      if (stopReason !== 'max_tokens' && isBriefingAnalysisOutputValid(text)) {
        return text.trim();
      }

      console.warn(`⚠️ análise_briefing retornou potencialmente incompleto. stop_reason=${stopReason || 'n/a'} tamanho=${text.length} tentativa=${attempt + 1}`);
      lastError = new Error('Saída potencialmente incompleta para analise_briefing');
    } catch (error) {
      lastError = error;
      console.error(`❌ Erro ao gerar analise_briefing na tentativa ${attempt + 1}:`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Não foi possível gerar a análise completa do briefing.');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let copyFormIdVar: string | null = null;
  let tableNameVar = 'copy_forms';

  try {
    console.log('🚀 Edge function generate-copy-ai iniciada');

    const body = await req.json();
    const { copyFormId, newCopyContext, appendToExisting, materialTypes, tableName: rawTableName } = body as {
      copyFormId?: string;
      newCopyContext?: string;
      appendToExisting?: boolean;
      materialTypes?: string[];
      tableName?: string;
    };

    const ALLOWED_TABLES = ['copy_forms', 'test_copy_forms'] as const;
    const tableName = ALLOWED_TABLES.includes(rawTableName as any) ? rawTableName! : 'copy_forms';
    tableNameVar = tableName;

    if (!copyFormId || typeof copyFormId !== 'string') {
      throw new Error('copyFormId é obrigatório');
    }
    if (newCopyContext !== undefined && typeof newCopyContext !== 'string') {
      throw new Error('newCopyContext inválido');
    }
    if (appendToExisting !== undefined && typeof appendToExisting !== 'boolean') {
      throw new Error('appendToExisting inválido');
    }

    copyFormIdVar = copyFormId;

    console.log('📝 ID do formulário recebido:', copyFormId);
    console.log('📝 Contexto de nova copy:', newCopyContext ? 'Sim' : 'Não');
    console.log('📝 Modo append:', appendToExisting ? 'Sim' : 'Não');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Buscando dados do formulário na tabela:', tableName);
    const { data: formData, error: formError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', copyFormId)
      .single();

    if (formError) {
      console.error('❌ Erro ao buscar formulário:', formError);
      throw new Error(`Erro ao buscar formulário: ${formError.message}`);
    }

    console.log('✅ Dados do formulário carregados:', {
      empresa: formData.nome_empresa,
      status: formData.status,
    });

    let documentsContent = '';
    const documentFiles = Array.isArray(formData.document_files) ? formData.document_files : [];

    if (documentFiles.length > 0) {
      console.log(`Processando ${documentFiles.length} documento(s)...`);

      try {
        const documentPromises = documentFiles.map(async (filePath: string) => {
          const { data: fileData, error: fileError } = await supabase.storage
            .from('briefing-documents')
            .download(filePath);

          if (fileError) {
            console.error(`Erro ao baixar ${filePath}:`, fileError);
            return `Erro ao processar arquivo: ${filePath}`;
          }

          const fileName = filePath.split('/').pop() || 'arquivo';
          const isTextLike = /\.(txt|md|csv|json)$/i.test(fileName);
          const isPdf = /\.pdf$/i.test(fileName);
          const isHtml = /\.html?$/i.test(fileName);

          if (isTextLike) {
            const text = await fileData.text();
            return `=== DOCUMENTO: ${fileName} ===\n${text}\n`;
          }

          if (isHtml) {
            try {
              console.log(`🌐 Extraindo texto do HTML: ${fileName}`);
              const rawHtml = await fileData.text();
              // Strip HTML tags to get clean text content
              const cleanText = rawHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/&quot;/gi, '"')
                .replace(/&#39;/gi, "'")
                .replace(/\s+/g, ' ')
                .trim();
              console.log(`✅ HTML ${fileName}: ${cleanText.length} caracteres extraídos`);
              return `=== DOCUMENTO HTML: ${fileName} ===\n${cleanText}\n`;
            } catch (htmlError) {
              console.error(`❌ Erro ao extrair HTML ${fileName}:`, htmlError);
              return `=== DOCUMENTO: ${fileName} ===\n[Erro ao extrair texto do HTML]\n`;
            }
          }

          if (isPdf) {
            try {
              console.log(`📄 Extraindo texto do PDF: ${fileName}`);
              const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
              const arrayBuffer = await fileData.arrayBuffer();
              const buffer = new Uint8Array(arrayBuffer);
              const pdfData = await pdfParse.default(buffer);
              console.log(`✅ PDF ${fileName}: ${pdfData.text.length} caracteres extraídos`);
              return `=== DOCUMENTO PDF: ${fileName} ===\n${pdfData.text}\n`;
            } catch (pdfError) {
              console.error(`❌ Erro ao extrair PDF ${fileName}:`, pdfError);
              return `=== DOCUMENTO: ${fileName} ===\n[Erro ao extrair texto do PDF]\n`;
            }
          }

          return `=== DOCUMENTO: ${fileName} (anexado) ===\n[Conteúdo não textual omitido no prompt para evitar ruído]\n`;
        });

        const documentsArray = await Promise.all(documentPromises);
        documentsContent = documentsArray.join('\n\n');
        console.log(`Documentos processados com sucesso. Total de caracteres: ${documentsContent.length}`);
      } catch (error) {
        console.error('Erro ao processar documentos:', error);
        documentsContent = 'Erro ao processar documentos anexados.';
      }
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const provider = 'anthropic';

    console.log('🔑 Verificando chave da API...');
    if (!apiKey) {
      console.error('❌ Chave da API Claude não encontrada');
      throw new Error('Chave da API Claude não configurada no Supabase');
    }
    console.log('✅ Chave da API encontrada');

    const analysisRequested = isBriefingAnalysisRequested(materialTypes);
    let aiResponse = '';

    if (analysisRequested) {
      console.log('🧠 Modo de análise de briefing ativado');
      aiResponse = await generateBriefingAnalysis({
        apiKey,
        formData,
        documentsContent,
      });
    } else {
      const rawCopyType = formData.copy_type || 'onboarding';
      const copyType = rawCopyType === 'onboarding' ? 'onboarding' : 'ongoing';

      console.log('📋 Buscando prompts do tipo:', copyType, '(fase original:', rawCopyType, ')');
      const { data: prompts } = await supabase
        .from('default_prompts')
        .select('*')
        .eq('is_active', true)
        .eq('copy_type', copyType)
        .order('position', { ascending: true });

      console.log('📝 Preparando system prompt completo...');
      console.log(`📊 Total de prompts ativos encontrados: ${prompts?.length || 0}`);

      if (prompts && prompts.length > 0) {
        console.log('📋 Títulos dos prompts carregados:');
        prompts.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.title} (${p.content?.length || 0} caracteres)`);
          if (p.title?.toLowerCase().includes('criativo') || p.content?.toLowerCase().includes('criativo estático')) {
            console.log('   ✅ Prompt de criativos estáticos ENCONTRADO!');
          }
        });
      }

      const fullSystemPrompt = buildSystemPrompt((prompts || []) as PromptRow[], documentsContent);
      const activeMaterialTypes = normalizeMaterialTypes(materialTypes);
      if (activeMaterialTypes.length === 0) {
        throw new Error('Nenhum tipo de material válido foi solicitado.');
      }

      const materialLabels = activeMaterialTypes.map((type) => MATERIAL_LABELS[type]);
      console.log('📦 Tipos de material solicitados:', materialLabels);

      const clientContext = buildClientContext(formData, newCopyContext);
      const generatedBlocks: string[] = [];

      for (const materialType of activeMaterialTypes) {
        console.log(`🧱 Gerando bloco de material: ${materialType}`);
        const generatedBlock = await generateMaterialBlock({
          apiKey,
          formData,
          clientContext,
          fullSystemPrompt,
          materialType,
        });
        generatedBlocks.push(generatedBlock);
      }

      aiResponse = generatedBlocks.join('\n\n---\n\n');
    }

    console.log('📝 Resposta gerada, tamanho:', aiResponse.length, 'caracteres');

    console.log('💾 Salvando resposta no banco...');

    let finalResponse = aiResponse;
    if (appendToExisting) {
      // Re-read current ai_response from DB (may have been updated by a prior call)
      const { data: freshData } = await supabase
        .from(tableName)
        .select('ai_response')
        .eq('id', copyFormId)
        .single();
      const existing = freshData?.ai_response;
      if (existing) {
        console.log('📎 Concatenando nova copy à resposta existente...');
        finalResponse = `${existing}\n\n---\n\n${aiResponse}`;
        console.log('📝 Resposta final, tamanho:', finalResponse.length, 'caracteres');
      }
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        ai_response: finalResponse,
        ai_provider: documentsContent ? `${provider}-with-docs` : provider,
        response_generated_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', copyFormId);

    if (updateError) {
      console.error('❌ Erro ao salvar no banco:', updateError);
      throw new Error(`Erro ao salvar resposta: ${updateError.message}`);
    }

    console.log('🎉 Processo finalizado com sucesso!');
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        copyFormId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('💥 Erro na função generate-copy-ai:', error);

    try {
      if (copyFormIdVar) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        await supabase
          .from(tableNameVar)
          .update({ status: 'failed' })
          .eq('id', copyFormIdVar);
      }
    } catch (e) {
      console.error('⚠️ Falha ao atualizar status para failed:', e);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
