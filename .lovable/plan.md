## Diagnóstico

A geração está demorando principalmente por três motivos:

- A função tenta primeiro o modelo `claude-sonnet-4-20250514`, que está retornando `404` em toda chamada. Só depois ela cai para `claude-opus-4-1-20250805`, adicionando uma tentativa inútil em cada bloco gerado.
- O modelo efetivamente usado é `claude-opus-4-1-20250805`, que tende a ser mais lento e caro para geração longa. Nos logs recentes, as chamadas completas levaram aproximadamente 60s a 87s, e uma anterior bateu perto de 150s com erro.
- A função pode gerar múltiplos materiais em sequência (`criativos`, `roteiro_video`, `landing_page`). Cada material vira uma chamada separada para a Anthropic, então selecionar vários entregáveis soma o tempo.

## Plano de correção

1. Remover o modelo inválido `claude-sonnet-4-20250514` da lista de fallback para eliminar a tentativa 404 em toda geração.
2. Reordenar os modelos para começar por um modelo mais rápido e válido, deixando `opus` apenas como fallback para casos que exigirem mais qualidade ou quando o modelo rápido falhar.
3. Ajustar os limites por tipo de material para evitar respostas longas demais sem necessidade:
   - `criativos`: limite menor
   - `roteiro_video`: limite intermediário
   - `landing_page`: limite maior
   - `analise_briefing`: manter limite próprio
4. Reduzir retries desnecessários: manter nova tentativa apenas quando a resposta vier realmente incompleta ou cortada por `max_tokens`.
5. Melhorar logs de performance por etapa para mostrar quanto tempo foi gasto em:
   - leitura do formulário
   - processamento dos documentos
   - busca dos prompts
   - chamada de IA por material
   - salvamento no banco

## Resultado esperado

- Gerações simples devem evitar a tentativa inválida e ficar mais rápidas.
- Gerações com vários materiais continuarão naturalmente mais longas, mas com menos desperdício.
- Os próximos logs vão mostrar exatamente onde o tempo está sendo gasto se ainda houver lentidão.