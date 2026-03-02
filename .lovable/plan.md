

## Plano: Refatoração da seção "Tendências e Notícias" — Layout Editorial

### Arquivos a criar

**`src/components/home/NewsHeroCard.tsx`**
- Card grande com imagem placeholder (gradient decorativo, já que as notícias mock não têm imagens reais — usar gradientes temáticos por categoria)
- Badge de categoria sobreposto no canto superior
- Overlay gradiente inferior para legibilidade
- Título grande (font-semibold/bold, line-clamp-2), excerpt (line-clamp-2), fonte + data
- Hover: leve zoom na imagem (`scale-105` com transition), `translateY(-2px)` no card
- `rounded-2xl`, glassmorphism (`bg-card/[0.06] backdrop-blur-xl border-border/10`)
- Recebe `NewsItem` como prop

**`src/components/home/NewsListItem.tsx`**
- Layout horizontal: thumbnail pequena à esquerda (gradient decorativo por categoria, `rounded-lg`, ~80x80), info à direita
- Título (font-medium, line-clamp-2), fonte + data (text-muted-foreground, opacidade reduzida)
- Sem excerpt
- Hover: highlight sutil (`border-primary/30`, `translateY(-1px)`)
- Glassmorphism no card (`bg-card/[0.06] backdrop-blur-lg border-border/10`)
- Recebe `NewsItem` como prop

### Arquivo a modificar

**`src/components/home/NewsFeed.tsx`**
- Importar `NewsHeroCard` e `NewsListItem`
- Manter header (título, busca, botão atualizar) intacto
- Lógica de renderização:
  - **Sem busca ativa**: `filtered[0]` → `NewsHeroCard`, `filtered.slice(1, 6)` → `NewsListItem` em lista vertical. Grid `grid-cols-1 lg:grid-cols-[2fr_1fr]` com gap
  - **Com busca ativa**: lista flat normal usando `NewsListItem` para todos os resultados
- Loading: skeleton grande (hero) + 4 skeletons menores (lista) no layout 2-col
- Animações de entrada via framer-motion (`fade + slideY`) nos cards
- Manter `fetchNews()`, `useDebounce`, filtro client-side, botão "Atualizar" inalterados

### Detalhes técnicos

- Imagens: como `NewsItem` não tem campo `image`, usar gradientes decorativos por categoria (Marketing=primary, Ads=blue, Negócios=emerald) como placeholder visual
- O `newsService.ts` não será alterado
- Nenhum outro componente ou página será modificado

