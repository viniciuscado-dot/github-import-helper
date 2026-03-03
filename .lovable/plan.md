

## Diagnóstico: TopBar não ocupa largura completa

### Problema
O `SidebarInset` (componente do shadcn/ui) é um `<main>` que dentro do layout flex deveria preencher todo o espaço. Porém, a propriedade `scrollbarGutter: "stable"` aplicada no `SidebarInset` reserva ~15px à direita para o scrollbar, criando espaço vazio visível mesmo quando não há scroll.

Além disso, o wrapper extra `<div className="flex-1 flex h-svh min-h-0 flex-col min-w-0">` ao redor de `MobileSidebarTrigger` + `SidebarInset` pode conflitar com o layout flex esperado pelo SidebarProvider.

### Solução

1. **Remover `scrollbarGutter: "stable"`** de todas as páginas que usam `SidebarInset` — isso elimina o espaço reservado à direita desnecessariamente.

2. **Adicionar `overflow-y-auto`** no SidebarInset para manter scroll funcional sem reservar espaço fixo.

3. **Páginas afetadas** (todas que têm `style={{ scrollbarGutter: "stable" }}`):
   - `Index.tsx`
   - `Aprovacao.tsx`
   - `AprovacaoEvolucao.tsx`
   - `AnaliseBenchResultado.tsx`
   - `Anuncios.tsx`
   - `Noticias.tsx`
   - 6 páginas Coming Soon (`SocialMedia*`, `Laboratorio*`)

### Mudança
Em cada página, trocar:
```tsx
<SidebarInset className="flex-1 min-h-0" style={{ scrollbarGutter: "stable" }}>
```
Por:
```tsx
<SidebarInset className="flex-1 min-h-0 overflow-y-auto">
```

Isso remove o espaço fantasma à direita e mantém o scroll natural.

