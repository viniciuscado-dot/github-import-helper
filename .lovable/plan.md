

## Incompatibilidade de Stack

Este projeto **não usa Next.js** — ele é construído com **Vite + React + React Router**. Portanto, não existe `src/app/api/` nem App Router. Criar `src/app/api/news/route.ts` não funcionaria.

O equivalente neste projeto para criar um endpoint backend é uma **Supabase Edge Function** (Deno), que é o padrão já utilizado em toda a codebase (ex: `generate-analise-bench`, `create-user`, etc.).

## Proposta Equivalente

Criar uma Edge Function `GET /functions/v1/news` que retorna:

```json
{ "message": "API de notícias funcionando" }
```

**Arquivo:** `supabase/functions/news/index.ts`

Nenhuma outra parte do sistema será modificada. O endpoint fica pronto para futura integração com RSS, onde substituiremos o JSON de teste pela lógica de fetch e parse dos feeds.

