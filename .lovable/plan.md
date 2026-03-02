

## Situacao Atual

O projeto ja possui **5 edge functions** que dependem de chaves Anthropic:

| Edge Function | Secret esperada |
|---|---|
| `anthropic-copias` | `ANTHROPIC_API_KEY` |
| `generate-copy-ai` | `ANTHROPIC_API_KEY` |
| `generate-analise-bench` | `ANTHROPIC_API_KEY_ANALISE` |
| `generate-case-copy` | `ANTHROPIC_API_KEY_CASES` ou `ANTHROPIC_API_KEY` |
| `test-anthropic` | `ANTHROPIC_API_KEY` |

Porem, **nenhuma dessas secrets esta configurada** no Supabase atualmente (so existe `LOVABLE_API_KEY`).

Alem disso, o feature flag `AI_ENABLED` esta `false` em `src/config/featureFlags.ts`.

## Plano

1. **Adicionar a secret `ANTHROPIC_API_KEY`** no Supabase via ferramenta de secrets -- voce precisara fornecer sua API key da Anthropic (obtida em [console.anthropic.com](https://console.anthropic.com/settings/keys)).

2. **Avaliar se as variantes sao necessarias** -- `ANTHROPIC_API_KEY_ANALISE` e `ANTHROPIC_API_KEY_CASES` podem ser a mesma key ou keys separadas. Se forem a mesma, adicionamos as 3 apontando para o mesmo valor. Se quiser keys separadas por modulo, adicionamos cada uma individualmente.

3. **Ativar o feature flag** -- alterar `AI_ENABLED` para `true` em `featureFlags.ts` para que as funcionalidades de IA deixem de mostrar mensagem de "desabilitado".

## Proximo passo

Preciso que voce confirme:
- Voce quer usar **uma unica API key** para todas as funcoes, ou keys separadas por modulo?
- Tem a key em maos para eu solicitar via ferramenta segura?

