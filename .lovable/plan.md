

## Plan: Melhorar aderência da IA aos prompts/exemplos

### Problema identificado

Os 7 prompts da aba "Prompts" são carregados e enviados ao Claude como system prompt. Porém:
- PDFs anexados como documentos são **descartados** (só `.txt/.md/.csv/.json` são lidos)
- O system prompt tem ~35K chars de exemplos sem instruções claras de qual seguir
- A instrução final ao modelo é genérica demais

### Correções propostas

#### 1. Suportar leitura de PDFs na edge function (`generate-copy-ai/index.ts`)

Substituir a verificação `isTextLike` por extração de texto de PDFs usando a mesma abordagem da função `anthropic-copias` (que já usa `pdf-parse`). Isso garante que documentos PDF anexados sejam incluídos no contexto da IA.

#### 2. Estruturar melhor o system prompt

No `generate-copy-ai/index.ts`, ao concatenar os prompts, adicionar marcadores claros:
- Separar o "Prompt Base" (instruções) dos "Exemplos" 
- Adicionar instrução explícita: **"VOCÊ DEVE seguir EXATAMENTE o formato e estrutura dos exemplos abaixo. Não invente seções, use as mesmas seções dos exemplos."**

#### 3. Reforçar a instrução no user message

Alterar a instrução final de "Agora gere o material completo seguindo todos os padrões e exemplos fornecidos no sistema." para algo mais diretivo como: "Gere o material usando EXATAMENTE a mesma estrutura, formato e estilo dos exemplos fornecidos no system prompt. Mantenha os mesmos cabeçalhos, seções e nível de detalhe."

### Arquivos alterados

- `supabase/functions/generate-copy-ai/index.ts` — Adicionar suporte a PDF + reestruturar prompt

### Sem alterações no frontend

O frontend já envia corretamente o `copy_type` e os prompts são carregados. A correção é 100% backend.

