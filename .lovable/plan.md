

## Plano: Refatoração do Sidebar — Área fixa + Área rolável + UX

### Problema atual

O sidebar usa `SidebarContent` como wrapper único para **tudo** (Home, seções de menu, e bloco admin/sair). O bloco inferior (`mt-auto`) fica dentro do `SidebarContent` que tem `overflow-auto`, então ele rola junto com o conteúdo quando há muitos itens.

### Mudança estrutural

Reorganizar o sidebar em 3 blocos usando `SidebarHeader`, `SidebarContent`, e `SidebarFooter` do Shadcn:

```text
┌─────────────────────┐
│  SidebarHeader      │  ← fixo (logo + Home)
│  (flex-shrink: 0)   │
├─────────────────────┤
│  SidebarContent     │  ← rolável (flex: 1, overflow-y: auto)
│  - Performance      │
│  - Social Media     │
│  - Laboratório      │
├─────────────────────┤
│  SidebarFooter      │  ← fixo (Usuários, Módulos, Sair, Avatar)
│  (flex-shrink: 0)   │
└─────────────────────┘
```

### Arquivo editado: `src/components/app-sidebar.tsx`

**Bloco Superior (SidebarHeader)** — mover o botão Home para dentro do `SidebarHeader`, logo abaixo do logo. Ambos ficam fixos no topo.

**Bloco Central (SidebarContent)** — conterá apenas as 3 seções de navegação (Performance, Social Media, Laboratório). O scroll minimalista acontece aqui. Remover o bloco `mt-auto` que hoje está dentro do `SidebarContent`.

**Bloco Inferior (SidebarFooter)** — mover para cá:
- Separador sutil (border-top com `border-border/10`)
- Usuários (admin only)
- Voltar para módulos
- Sair
- Avatar do usuário logado (já está no footer, só precisa manter)

### Melhorias de UX (mesmo arquivo)

1. **Títulos de grupo**: adicionar `uppercase text-[10px] font-semibold tracking-wider opacity-60 mt-4` nos `SidebarGroupLabel`
2. **Itens de menu**: aumentar padding vertical (`py-2.5` em vez do padrão `p-2`), garantir `gap-3` entre ícone e label
3. **Hover**: transição `duration-150 ease-in-out` (já presente, apenas confirmar)
4. **Scrollbar**: adicionar classe `scrollbar-thin` ao `SidebarContent` para scroll minimalista
5. **Espaçamento entre grupos**: `pt-2` entre seções para separação visual

### Arquivo editado: `src/components/ui/sidebar.tsx`

Nenhuma mudança necessária — o componente `SidebarContent` já tem `overflow-auto` e `flex-1`, e `SidebarHeader`/`SidebarFooter` já são `flex-shrink: 0` por padrão.

### O que NÃO muda

- Rotas, autenticação, lógica de navegação
- Cores, ícones, identidade DOT
- Lógica de collapsed/expanded
- Tooltips no modo icon
- Dialog "Voltar para módulos"
- UserProfilePopover

