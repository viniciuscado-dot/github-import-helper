

## Padronizar margens laterais em todas as páginas

### Padrão de referência (Index.tsx / Copy / Aprovacao / Anuncios)
- Top bar: `max-w-[1280px] mx-auto px-4 md:px-6`
- Main: `max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6`

### Páginas que precisam de ajuste

| Pagina | Problema | Correção |
|---|---|---|
| **Noticias.tsx** | `px-4 md:px-8 py-8 space-y-8` | Mudar para `px-4 md:px-6 py-6 space-y-6` |
| **AprovacaoEvolucao.tsx** | Top bar sem `max-w-[1280px] mx-auto`; main sem `max-w-[1280px] mx-auto`, usa `py-5 space-y-4` | Adicionar `max-w-[1280px] mx-auto` no top bar e main; mudar para `py-6 space-y-6` |
| **AnaliseBenchResultado.tsx** | Top bar e conteudo usam `max-w-[1400px]` em vez de `1280px`; conteudo principal em `px-4 md:px-6` sem `max-w-[1280px] mx-auto` no wrapper | Mudar `1400px` para `1280px`; envolver conteudo em `max-w-[1280px] mx-auto px-4 md:px-6 py-6 space-y-6` |
| **PageComingSoon pages** (6 pages: SocialMediaVarredura, SocialMediaCentralPosts, SocialMediaPlanejamento, LaboratorioBancoIdeias, LaboratorioDiagnosticoVisual, LaboratorioEditorVideo, LaboratorioLPBuilder) | Sem top bar com NotificationCenter; conteudo sem container padrao | Adicionar top bar padrao e envolver PageComingSoon em `<main>` com classes padrao |
| **Anuncios.tsx** | Ja esta padronizado | Nenhuma |
| **Aprovacao.tsx** | Ja esta padronizado | Nenhuma |
| **Index.tsx** | Ja esta padronizado (referencia) | Nenhuma |

### Paginas publicas excluidas (sem sidebar, layout proprio)
- AnaliseArtefato.tsx (pagina publica de compartilhamento)
- AprovacaoCliente.tsx (pagina publica de aprovacao)
- Auth.tsx, AuthHandoff.tsx, SetPassword.tsx, Logout.tsx, NotFound.tsx

### Arquivos a editar
1. **Noticias.tsx** -- ajustar classes do `<main>`
2. **AprovacaoEvolucao.tsx** -- adicionar `max-w-[1280px] mx-auto` no top bar e main, ajustar spacing
3. **AnaliseBenchResultado.tsx** -- trocar `1400px` por `1280px`, adicionar container padrao
4. **7 paginas "Coming Soon"** -- adicionar top bar + container padrao (NotificationCenter, header, main wrapper)

