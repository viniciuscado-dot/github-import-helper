

## Plan: Thumbnails AI para News sem Imagem + Tags na Home

### Problema atual
1. News sem imagem do RSS exibem apenas um gradiente vazio genérico
2. Os `NewsListItem` na Home (lista lateral) nao exibem a tag de categoria (apenas o HeroCard tem)

### Solucao

#### 1. Geração de thumbnails via IA (Edge Function)

Criar uma edge function `generate-news-thumbnail` que:
- Recebe `title`, `category` e `excerpt`
- Usa Lovable AI (`google/gemini-2.5-flash-image`) para gerar uma imagem ilustrativa baseada no conteudo
- Retorna a imagem base64

Na edge function `news/index.ts`, para itens sem imagem, chamar essa funcao e retornar a URL gerada. Porem, gerar 10+ imagens por request seria lento.

**Abordagem otimizada**: Gerar as imagens no frontend sob demanda — o componente detecta `!item.image`, chama a edge function para aquele item especifico, e armazena o resultado em state. Limitar a 3-4 gerações simultâneas para nao sobrecarregar.

Alternativa mais pragmática: gerar as imagens diretamente na edge function `news` apenas para os primeiros itens sem imagem (max 5), usando prompts curtos como:
> "Abstract minimalist illustration for a news article about [title]. Dark background, modern, editorial style. No text."

#### 2. Tags nas NewsListItem da Home

Adicionar um `Badge` compacto no canto superior-direito da thumbnail de cada `NewsListItem`, reutilizando os mesmos `categoryColors` do `NewsHeroCard`. Estilo: pequeno, sólido, `text-[9px]`, posicionado `absolute top-1.5 right-1.5`.

Expandir o mapa `categoryGradients` e `categoryDots` no `NewsListItem` para incluir todas as 8 categorias (IA, SEO, Social, Vendas, Design).

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-news-thumbnail/index.ts` | Criar — edge function que gera imagem via Lovable AI |
| `supabase/config.toml` | Adicionar entrada para `generate-news-thumbnail` |
| `src/services/newsService.ts` | Adicionar funcao `generateThumbnail()` que chama a edge function |
| `src/components/home/NewsListItem.tsx` | Adicionar Badge de categoria + logica para gerar thumbnail quando `!item.image` |
| `src/components/home/NewsHeroCard.tsx` | Adicionar logica de thumbnail AI para fallback |
| `src/components/home/NewsFeed.tsx` | Gerenciar state de thumbnails geradas, passando para os cards |

### Fluxo técnico

```text
NewsFeed carrega news
  ↓
Para cada item sem image:
  → chama generateThumbnail(title, category)
  → edge function → Lovable AI (gemini-2.5-flash-image)
  → retorna base64 data URL
  → atualiza state do item com a imagem gerada
  ↓
Cards renderizam com imagem real ou gerada
```

### Detalhes da Edge Function

```text
POST /generate-news-thumbnail
Body: { title, category, excerpt }
→ Prompt: "Create a minimalist abstract editorial illustration 
   for: [title]. Category: [category]. 
   Style: dark moody gradient, modern, no text, 16:9"
→ Response: { image: "data:image/png;base64,..." }
```

### Tags no NewsListItem

Badge posicionado `absolute top-1.5 right-1.5` dentro da div da thumbnail, com cores solidas por categoria identicas as do HeroCard.

