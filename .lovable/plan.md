

## Ajuste do cabeçalho + botão "Ver Agenda"

### 1. Problema do espaço vazio
Todas as 12 páginas têm um cabeçalho sticky `h-14` com `justify-end`, posicionando apenas o `NotificationCenter` no canto direito — o resto fica vazio. A página de Notícias nem tem esse cabeçalho padrão.

### 2. Solução

**Criar componente `TopBar.tsx`** — centraliza o cabeçalho de topo para todas as páginas. Contém:
- Layout `h-10` (reduzir de 56px para 40px, eliminando espaço vazio excessivo)
- `justify-end` com gap entre itens
- Botão "Ver Agenda" (ícone `CalendarDays` + texto) + `NotificationCenter`

**Criar componente `AgendaPanel.tsx`** — painel lateral fixo na margem direita (Sheet lado `right`):
- Abre ao clicar "Ver Agenda"
- Mostra a data do dia atual
- Lista de eventos/compromissos do dia (dados mock por enquanto, preparado para Google Calendar futuro)
- Visual consistente com a sidebar esquerda (mesma largura, borda, blur)

**Atualizar todas as 12 páginas** — substituir o bloco repetido por `<TopBar />`:
- `Index.tsx`, `Aprovacao.tsx`, `AprovacaoEvolucao.tsx`, `AnaliseBenchResultado.tsx`, `Anuncios.tsx`, `Noticias.tsx` (adicionar cabeçalho), e as 6 páginas Coming Soon

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/TopBar.tsx` | **Criar** — componente com NotificationCenter + botão Agenda |
| `src/components/AgendaPanel.tsx` | **Criar** — Sheet lateral direita com agenda do dia (mock data, pronto para Google Calendar) |
| 12 páginas | Substituir bloco de cabeçalho por `<TopBar />` |

### Comportamento
- Cabeçalho mais compacto, sem espaço vazio
- Botão "Ver Agenda" com ícone de calendário ao lado das notificações
- Clique abre painel lateral direito com agenda do dia
- Dados mock com eventos de exemplo; estrutura pronta para integração com Google Calendar

