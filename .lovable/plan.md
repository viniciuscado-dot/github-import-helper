

## Plan: Substituir campo de busca por Combobox (seletor com busca)

### O que será feito

Substituir o `Input` de "Buscar cliente..." em ambas as páginas por um **Popover + Command** (combobox) que permite:
- Digitar o nome do cliente para filtrar a lista
- Ver todos os clientes cadastrados no dropdown
- Clicar para selecionar um cliente (filtra os cards)
- Limpar a seleção

### Componente utilizado

Usar `Command` (cmdk) + `Popover` já existentes no projeto (`src/components/ui/command.tsx` + `src/components/ui/popover.tsx`) para criar o combobox inline, sem precisar de novo componente.

### Arquivos alterados

1. **`src/pages/CopyEstrategia.tsx`** — Substituir o `<Input>` de busca (linhas 190-198) por um Popover+Command combobox que lista os clientes e filtra enquanto digita. Importar `Command, CommandInput, CommandList, CommandEmpty, CommandItem` e `Check` icon.

2. **`src/pages/AnaliseBenchSelecao.tsx`** — Mesma alteração (linhas 170-174). Substituir Input por combobox idêntico.

### Comportamento

- Ao clicar no campo, abre dropdown com todos os clientes
- Ao digitar, filtra a lista em tempo real
- Ao selecionar um cliente, o `search` state é preenchido com o nome (filtrando os cards)
- Ícone de check aparece no cliente selecionado
- Botão X para limpar a seleção

