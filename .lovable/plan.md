

## Fix: "Invalid Date" nas Notícias

### Causa raiz
Em `src/services/newsService.ts`, linha que mapeia a data:
```ts
published_at: item.date?.split(" ")[0] || ""
```
Isso pega apenas `"Tue,"` de `"Tue, 03 Mar 2026 09:43:16 +0000"`, que é inválido para `new Date()`.

### Solução
Passar a string de data completa do RSS (`item.date`) diretamente para `published_at`, sem o `.split(" ")[0]`. A string RFC 2822 completa (ex: `"Tue, 03 Mar 2026 09:43:16 +0000"`) é nativamente parseável por `new Date()`.

### Arquivo a editar
- `src/services/newsService.ts` — alterar a linha do mapeamento de `published_at` para usar `item.date || ""` sem split.

