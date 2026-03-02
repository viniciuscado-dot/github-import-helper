

## Plano: Corrigir alinhamento do Home, footer e espaçamento

### Problemas identificados

1. **Home desalinhado**: Está dentro de um `SidebarMenu` com `className="mt-2 px-2"` — o `px-2` extra desalinha com os itens do bloco central que usam `SidebarGroup > SidebarGroupContent > SidebarMenu` (sem padding extra).

2. **Footer desalinhado**: O `SidebarFooter` tem `p-4 pt-3` quando expandido, enquanto os grupos do `SidebarContent` usam o padding padrão do `SidebarGroup`. Isso cria desalinhamento horizontal entre os itens do menu e os itens do footer.

3. **Espaçamento insuficiente**: Falta separação visual entre o último item do bloco rolável (Laboratório) e o bloco inferior fixo.

### Correções no `src/components/app-sidebar.tsx`

**Home** — Remover o `px-2` do `SidebarMenu` wrapper e envolver o Home num `SidebarGroup > SidebarGroupContent > SidebarMenu` igual aos demais, para herdar o mesmo padding/alinhamento.

**Footer** — Trocar `p-4 pt-3` por `px-2 pt-3 pb-2` (mesma margem lateral que o `SidebarContent` usa internamente). Em modo collapsed, manter `py-3`.

**Espaçamento** — Adicionar `pb-4` ao `SidebarContent` para dar mais respiro antes do footer. Aumentar o `pt` do footer para `pt-4`.

