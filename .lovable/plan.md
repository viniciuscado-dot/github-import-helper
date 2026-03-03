

## Plano: Evoluir Edge Function `news` com RSS da HubSpot

Atualizar `supabase/functions/news/index.ts` para:

1. Fazer `fetch` do RSS `https://blog.hubspot.com/marketing/rss.xml`
2. Parsear o XML usando `DOMParser` (nativo no Deno) — sem dependências externas
3. Extrair `title`, `description`, `link`, `pubDate` de cada `<item>`
4. Retornar no máximo 10 itens no formato `{ items: [...] }`
5. Manter CORS e tratamento de erro

Nenhum outro arquivo será modificado.

