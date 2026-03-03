

## Plano: Conectar `newsService.ts` à Edge Function real

Atualizar `src/services/newsService.ts`:

1. Substituir o corpo de `fetchNews()` por um `fetch` real ao endpoint `https://cesohdhspysooaowtvsu.supabase.co/functions/v1/news`
2. Mapear os itens retornados (`{ title, description, link, date }`) para o formato `NewsItem` existente:
   - `id`: index convertido em string
   - `title`: `item.title`
   - `excerpt`: `item.description`
   - `source`: `"HubSpot"`
   - `published_at`: `item.date` convertido para `YYYY-MM-DD` via `Date`
   - `category`: `"Marketing"`
   - `url`: `item.link`
3. Fallback para `MOCK_NEWS` caso o fetch falhe (resiliência)
4. Remover `shuffle` e o delay simulado — dados vêm da API real
5. Manter `NewsItem` interface intacta, manter `MOCK_NEWS` declarado como fallback

Nenhum outro arquivo será modificado.

