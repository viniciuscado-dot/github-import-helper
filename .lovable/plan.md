

## Plano: Usar `item.image` como background nos cards de notícias

Dois arquivos serão modificados: `NewsHeroCard.tsx` e `NewsListItem.tsx`.

### NewsHeroCard.tsx
- Na div de imagem (aspect-[16/9]), verificar se `item.image` existe
- Se sim: renderizar uma `<img>` com `object-cover` preenchendo o container, e manter o overlay escuro existente (`bg-gradient-to-t from-background/90...`) para legibilidade
- Se não: manter o gradient placeholder atual como fallback
- Nenhuma alteração em layout, padding ou estrutura

### NewsListItem.tsx
- Na div de thumbnail (`w-28 h-20`), verificar se `item.image` existe
- Se sim: renderizar uma `<img>` com `object-cover` + overlay `bg-black/60` sobre ela para legibilidade do texto
- Se não: manter o gradient atual como fallback
- Nenhuma alteração em layout ou estrutura

### Detalhes técnicos
- Usar `<img>` com `object-cover w-full h-full absolute inset-0` dentro de containers `relative overflow-hidden` (que já existem)
- Overlay escuro via div absoluta `bg-black/60` quando imagem presente
- Sem alterações em outros arquivos

