

## Thumbnails confiáveis para todas as notícias

### Problema
O sistema já gera thumbnails AI para notícias sem imagem (`!n.image`), mas falha silenciosamente em dois cenários:
1. **Imagens RSS quebradas**: o RSS retorna uma URL de imagem, mas ela dá 404 ou falha ao renderizar. O sistema acha que a notícia já tem imagem e não gera thumbnail.
2. **Imagem vazia como string**: `item.image` vem como `""` — que é falsy, então deveria acionar a geração, mas a lógica em `NewsFeed` e `Noticias` só checa `!n.image`, e string vazia é falsy (ok), porém se vier um espaço ou URL inválida curta, passa.

### Solução

**1. Componente `NewsThumbnail` centralizado** — substituir todos os blocos `{item.image ? <img> : <gradient>}` por um único componente que:
- Renderiza `<img>` se `item.image` existe
- No `onError` do `<img>`, marca a imagem como quebrada e chama `generateThumbnail`
- Enquanto gera, mostra o gradiente de fallback com um indicador sutil de loading
- Quando a thumbnail AI é recebida, atualiza via callback `onImageGenerated(id, url)`

**2. Callback de atualização** — `NewsFeed.tsx` e `Noticias.tsx` passam um callback `onImageGenerated` que atualiza o state `news` com a nova URL, exatamente como já fazem no `useEffect` de geração.

**3. Deduplicação** — manter o `generatingRef` existente para evitar chamadas duplicadas ao mesmo item (tanto do useEffect inicial quanto do onError).

### Arquivos a editar

| Arquivo | Ação |
|---|---|
| `src/components/home/NewsThumbnail.tsx` | **Criar** — componente que recebe `item`, `className`, `onImageGenerated` callback. Renderiza img com onError fallback + geração automática |
| `src/components/home/NewsHeroCard.tsx` | Usar `NewsThumbnail` no lugar do bloco img/gradient |
| `src/components/home/NewsListItem.tsx` | Usar `NewsThumbnail` no lugar do bloco img/gradient |
| `src/components/home/NewsFeed.tsx` | Passar callback de atualização para os cards |
| `src/pages/Noticias.tsx` | Usar `NewsThumbnail` nos componentes HeroCard, GridCard e ListRow internos; passar callback de atualização |

### Comportamento final
- Notícia com imagem válida → exibe normalmente
- Notícia sem imagem → gera thumbnail AI, salva permanentemente, exibe
- Notícia com imagem quebrada (404/erro) → detecta via `onError`, gera thumbnail AI, salva permanentemente, exibe

