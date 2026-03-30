
Objetivo: corrigir definitivamente o erro `column profiles.user_id does not exist` ao salvar permissões e garantir que a edição de usuários (incluindo quem entra com Google) funcione sem regressão.

### Diagnóstico (causa raiz)
- A tabela `profiles` usa **`id`** como chave do usuário.
- Existem pontos no frontend tentando filtrar `profiles` por **`user_id`** (coluna que não existe no banco).
- Quando você salva permissões no modal, isso quebra na atualização de `custom_role_id` em `profiles`.

### Plano de implementação

1. **Corrigir o salvamento de permissões no modal (erro principal)**
- Arquivo: `src/components/UserPermissions.tsx`
- Ajustar:
  - de: `.from('profiles').update(...).eq('user_id', userId)`
  - para: `.from('profiles').update(...).eq('id', userId)`
- Manter o restante da lógica de `user_module_permissions` como está (upsert continua igual).

2. **Padronizar TODOS os acessos à tabela `profiles` para `id`**
- Arquivos:
  - `src/components/UserProfilePopover.tsx`
  - `src/components/UserProfile.tsx`
  - `src/pages/AuthHandoff.tsx`
- Trocar filtros em `profiles` que usam `.eq('user_id', ...)` por `.eq('id', ...)`.
- Isso evita novos erros em fluxos adjacentes (perfil, avatar, handoff/login).

3. **Hardening para evitar regressão futura**
- Onde houver uso de `profile.user_id` (campo de compatibilidade de UI), usar esse valor apenas como variável local, mas **sempre** consultar `profiles.id` no banco.
- Adicionar validação defensiva antes de update:
  - se não houver `userId` válido, bloquear submit e mostrar toast claro.
- Resultado: mesmo com ajustes futuros de UI, queries continuam corretas no banco.

4. **Garantia para usuários Google (@dotconceito.com)**
- Não muda a regra de domínio já aplicada.
- Usuário Google continua sendo mapeado no `profiles` pelo mesmo UUID do auth.
- Com a correção para `profiles.id`, admin/workspace_admin consegue editar permissões desses usuários normalmente.

### Validação (checklist de aceite)
1. Logar com usuário admin/workspace_admin.
2. Abrir **Usuários → Permissões** de um usuário Google (ex.: Elias).
3. Alterar função/permissões e clicar **Salvar Permissões**.
4. Confirmar:
   - sem toast vermelho;
   - toast de sucesso;
   - ao reabrir modal, mudanças persistidas.
5. Validar fluxos relacionados:
   - edição de perfil;
   - upload de avatar;
   - handoff/auth sem erro de coluna `user_id`.

### Arquivos a modificar
- `src/components/UserPermissions.tsx`
- `src/components/UserProfilePopover.tsx`
- `src/components/UserProfile.tsx`
- `src/pages/AuthHandoff.tsx`

### Escopo que permanece igual
- Regras de permissão por módulo (RLS + RPC existentes)
- Hierarquia admin/workspace_admin
- Restrição de login Google para `@dotconceito.com`
- Estrutura visual e navegação
