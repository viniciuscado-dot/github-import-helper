

## Diagnóstico: Thumbnails não estão sendo geradas

### O que está acontecendo

A lógica do `NewsThumbnail` **já está correta** e já força a geração quando a imagem não carrega:
- Sem imagem → aciona geração automaticamente
- Imagem quebrada (404/erro) → `onError` aciona geração

**O problema real**: a Edge Function `generate-news-thumbnail` está retornando **HTTP 402 (Payment Required)**. Isso significa que o `LOVABLE_API_KEY` configurado no Supabase atingiu o limite de uso do AI gateway.

```
POST .../generate-news-thumbnail → 402 {"error":"Payment required"}
```

### Solução

Não é necessária nenhuma alteração de código. Para as thumbnails funcionarem:

1. **Verificar o LOVABLE_API_KEY** — confirmar se a chave está válida e com créditos disponíveis no painel Lovable
2. **Renovar créditos ou chave** — se o limite foi atingido, renovar o plano ou gerar uma nova chave

Uma vez resolvido o problema de billing, todas as notícias sem imagem (ou com imagem quebrada) terão thumbnails AI geradas e salvas permanentemente no Supabase Storage, exatamente como planejado.

