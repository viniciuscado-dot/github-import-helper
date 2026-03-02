import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let briefingIdVar: string | null = null;

  try {
    const { briefingId } = await req.json();
    briefingIdVar = briefingId;

    if (!briefingId) {
      return new Response(
        JSON.stringify({ error: 'briefingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Edge function generate-analise-bench iniciada');
    console.log('📝 briefingId:', briefingId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY_ANALISE');

    if (!anthropicApiKey) {
      console.error('❌ ANTHROPIC_API_KEY_ANALISE not configured');
      throw new Error('API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar briefing
    console.log('🔍 Buscando briefing...');
    const { data: briefing, error: briefingError } = await supabase
      .from('analise_bench_forms')
      .select('*')
      .eq('id', briefingId)
      .single();

    if (briefingError || !briefing) {
      console.error('❌ Error fetching briefing:', briefingError);
      throw new Error('Briefing not found');
    }

    console.log('✅ Briefing carregado:', briefing.nome_empresa);

    // Montar contexto do briefing
    const competitors = briefing.competitors || [];

    let briefingContext = `
INFORMAÇÕES DO CLIENTE:
Nome da empresa: ${briefing.nome_empresa || 'Não especificado'}
Nicho: ${briefing.nicho_empresa || 'Não especificado'}
Site: ${briefing.site || 'Não especificado'}
Serviços/Produtos: ${briefing.servicos_produtos || 'Não especificado'}
Diferenciais competitivos: ${briefing.diferenciais_competitivos || 'Não especificado'}
Público-alvo: ${briefing.publico_alvo || 'Não especificado'}
Objetivo do projeto: ${briefing.objetivo_projeto || 'Não especificado'}
Maior desafio: ${briefing.maior_desafio || 'Não especificado'}
`;

    if (competitors && competitors.length > 0) {
      briefingContext += '\n\nCONCORRENTES:\n';
      competitors.forEach((comp: any, idx: number) => {
        briefingContext += `\n${idx + 1}. ${comp.nome || 'Sem nome'}`;
        briefingContext += `\n   Tipo: ${comp.tipo === 'direto' ? 'Concorrente Direto' : 'Concorrente Indireto'}`;
        if (comp.site) briefingContext += `\n   Site: ${comp.site}`;
        if (comp.instagram_linkedin) briefingContext += `\n   Instagram/LinkedIn: ${comp.instagram_linkedin}`;
        if (comp.porque_escolhido) briefingContext += `\n   Por que foi escolhido: ${comp.porque_escolhido}`;
      });
    }

    if (briefing.objetivo_benchmark && briefing.objetivo_benchmark.length > 0) {
      briefingContext += '\n\nOBJETIVOS DO BENCHMARK:\n';
      briefing.objetivo_benchmark.forEach((obj: string) => {
        briefingContext += `- ${obj}\n`;
      });
    }

    if (briefing.objetivo_benchmark_outro) {
      briefingContext += `- Outro: ${briefing.objetivo_benchmark_outro}\n`;
    }

    if (briefing.aspecto_prioritario) {
      briefingContext += `\nASPECTO PRIORITÁRIO: ${briefing.aspecto_prioritario}\n`;
    }

    if (briefing.informacoes_adicionais) {
      briefingContext += `\nINFORMAÇÕES ADICIONAIS: ${briefing.informacoes_adicionais}\n`;
    }

    // Buscar prompts ativos para analise_bench
    console.log('📋 Buscando prompts do tipo analise_bench...');
    const { data: prompts, error: promptsError } = await supabase
      .from('default_prompts')
      .select('*')
      .eq('copy_type', 'analise_bench')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (promptsError) {
      console.error('❌ Error fetching prompts:', promptsError);
    }

    const activePrompts = prompts || [];
    console.log(`📊 Total de prompts ativos encontrados: ${activePrompts.length}`);

    if (activePrompts.length > 0) {
      activePrompts.forEach((p: any, idx: number) => {
        console.log(`  ${idx + 1}. ${p.title} (${p.content?.length || 0} caracteres)`);
      });
    }

    // Montar system prompt
    let systemPrompt = 'Você é um especialista em análise de mercado e benchmarking competitivo.';
    if (activePrompts.length > 0) {
      systemPrompt = activePrompts.map((p: any) => p.content).join('\n\n');
    }

    // Build user message content (text + optional logo image)
    const userContent: any[] = [];

    // If there's a client logo, fetch it and add as image for vision analysis
    if (briefing.client_logo_url) {
      console.log('🖼️ Logo do cliente encontrado, baixando para análise visual...');
      try {
        const logoResp = await fetch(briefing.client_logo_url);
        if (logoResp.ok) {
          const logoBuffer = await logoResp.arrayBuffer();
          const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBuffer)));
          const contentType = logoResp.headers.get('content-type') || 'image/png';
          
          // Only add as image if it's an actual image type (not PDF)
          if (contentType.startsWith('image/')) {
            userContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: contentType,
                data: logoBase64,
              },
            });
            briefingContext += '\n\nLOGO DO CLIENTE: O logo do cliente foi anexado como imagem acima. Analise a identidade visual (cores, tipografia, estilo, elementos gráficos) e considere isso na sua análise de benchmarking.\n';
            console.log('✅ Logo adicionado como imagem para análise visual');
          } else {
            briefingContext += `\n\nLOGO DO CLIENTE: Um arquivo de logo foi fornecido (${contentType}), mas não pôde ser analisado visualmente.\n`;
          }
        }
      } catch (logoErr) {
        console.error('⚠️ Erro ao baixar logo:', logoErr);
        briefingContext += '\n\nLOGO DO CLIENTE: Não foi possível carregar o logo para análise.\n';
      }
    }

    const formatInstruction = `

INSTRUÇÃO OBRIGATÓRIA DE FORMATO:
- Sua resposta DEVE ser escrita exclusivamente em Markdown puro (títulos com #, listas com -, tabelas com |, negrito com **, etc.).
- NÃO gere HTML, CSS, JavaScript ou qualquer código de programação.
- NÃO crie páginas web, documentos HTML ou artefatos interativos.
- O conteúdo será renderizado automaticamente por um componente Markdown — basta escrever o texto formatado.
- Use tabelas Markdown para comparações, listas para itens, e headings para organizar seções.
`;

    userContent.push({ type: 'text', text: briefingContext + formatInstruction });

    // Chamar API Claude com fallback de modelos
    console.log('🤖 Chamando API da Anthropic...');
    const candidateModels = [
      'claude-sonnet-4-20250514',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307'
    ];

    let data: any = null;
    let lastErrorText = '';
    for (const model of candidateModels) {
      console.log('🧪 Tentando modelo:', model);
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          max_tokens: 8000,
          messages: [
            { role: 'user', content: userContent }
          ],
        }),
      });

      console.log('📡 Status do modelo', model, ':', resp.status);
      if (resp.ok) {
        data = await resp.json();
        console.log('✅ Modelo aceito:', model);
        break;
      } else {
        lastErrorText = await resp.text();
        console.error('❌ Erro com modelo', model, ':', lastErrorText);
      }
    }

    if (!data) {
      throw new Error(`Nenhum modelo Anthropic aceitou a requisição. Último erro: ${lastErrorText}`);
    }

    const generatedAnalysis = data.content[0].text;
    console.log('📝 Resposta gerada, tamanho:', generatedAnalysis.length, 'caracteres');

    // Salvar resultado no briefing
    console.log('💾 Salvando resposta no banco...');
    const { error: updateError } = await supabase
      .from('analise_bench_forms')
      .update({
        ai_response: generatedAnalysis,
        ai_provider: 'anthropic',
        response_generated_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', briefingId);

    if (updateError) {
      console.error('❌ Erro ao salvar no banco:', updateError);
      throw new Error(`Erro ao salvar resposta: ${updateError.message}`);
    }

    console.log('🎉 Processo finalizado com sucesso!');
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: generatedAnalysis,
        briefingId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro na função generate-analise-bench:', error);

    // Marcar briefing como failed
    try {
      if (briefingIdVar) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await supabase
          .from('analise_bench_forms')
          .update({ status: 'failed' })
          .eq('id', briefingIdVar);
      }
    } catch (e) {
      console.error('⚠️ Falha ao atualizar status para failed:', e);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
