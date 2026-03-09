

## Plan: Padronizar Análise e Bench com mesma estrutura de Copy e Estratégia

### O que será feito

Reescrever `src/pages/AnaliseBenchSelecao.tsx` para usar o mesmo padrão de `CopyEstrategia.tsx`:
- Remover `MOCK_CLIENTS` e buscar dados da tabela `copy_clients` no Supabase (mesma tabela compartilhada)
- Adicionar botão "+ Adicionar Cliente" no header (mesmo posicionamento: à direita do título)
- Adicionar Dialog de criação (nome + squad), idêntico ao de Copy e Estratégia
- Padronizar badges sem prefixo "Squad " (apenas o nome, como em Copy e Estratégia)
- Manter loading state e empty state consistentes

### Arquivo alterado

**`src/pages/AnaliseBenchSelecao.tsx`** — Reescrito para espelhar a estrutura de `CopyEstrategia.tsx`:
- Importar `useEffect`, `supabase`, `useAuth`, `toast`, `Dialog`, `Label`, `Plus`
- Remover `MockClient` interface, `MOCK_CLIENTS` constant, `parseDate` helper
- Adicionar `CopyClient` interface + `fetchClients` async from `copy_clients` table
- Adicionar dialog state (`dialogOpen`, `newName`, `newSquad`, `saving`) e `handleAddClient`
- Ajustar `filteredClients` para usar `new Date(c.created_at)` em vez de `parseDate(c.entryDate)`
- Cards: usar `client.id` como key, `format(new Date(client.created_at), ...)` para data, badge sem "Squad "
- Header: adicionar `<Button>` "+ Adicionar Cliente" e "Limpar filtros" no mesmo container à direita
- Select items sem prefixo "Squad " para consistência

Nenhum outro arquivo será alterado. Ambas as páginas compartilham a mesma tabela `copy_clients`.

