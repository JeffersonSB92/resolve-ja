# Testes da API ResolveJa

## Objetivo

A suíte de testes valida o comportamento da API em cenários reais de autenticação, autorização e fluxo de negócio do marketplace.

Os testes priorizam integração via `buildApp()` + `app.inject()` (sem subir servidor HTTP em porta real).

## Como rodar

Executar uma vez:

```bash
npm test
```

Executar em watch mode:

```bash
npm run test:watch
```

## Variáveis de ambiente necessárias

Defina as variáveis abaixo no ambiente de testes (por exemplo, em `.env` com `NODE_ENV=test`):

- `NODE_ENV=test`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (usada apenas em helpers de seed/cleanup/setup controlado)
- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_CUSTOMER_EMAIL`
- `TEST_CUSTOMER_PASSWORD`
- `TEST_PROVIDER_EMAIL`
- `TEST_PROVIDER_PASSWORD`
- `TEST_PENDING_PROVIDER_EMAIL`
- `TEST_PENDING_PROVIDER_PASSWORD`
- `TEST_OTHER_USER_EMAIL`
- `TEST_OTHER_USER_PASSWORD`

## Como criar usuários de teste no Supabase

1. Acesse o painel do Supabase.
2. Vá em `Authentication > Users`.
3. Crie os usuários com email/senha correspondentes às variáveis `TEST_*`.
4. Garanta que os usuários existam também nas tabelas de perfil/roles usadas pela API (ex.: `profiles`, `app_user_roles`, `provider_profiles` quando aplicável).
5. Para o usuário admin, garanta o papel `admin` em `app_user_roles` (ou estrutura equivalente do projeto).

## Usuários de teste que precisam existir

- Admin
- Cliente
- Prestador ativo
- Prestador pendente
- Outro usuário comum

## Segurança importante

- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser usada no frontend.
- Ela é exclusiva de backend/testes e usada de forma isolada em setup/cleanup.
- O cleanup da suíte apaga apenas dados marcados com prefixo `[TEST]`.

## Ordem recomendada dos principais testes

A execução pode ser paralela, mas para diagnóstico humano a ordem abaixo ajuda:

1. `health`
2. `auth`
3. `addresses`
4. `providers`
5. `requests`
6. `quotes`
7. `attendance-flow`
8. `security`
9. `full-flow`

## Debug de falhas comuns

- Token inválido:
  - Verifique `TEST_*_EMAIL/PASSWORD`.
  - Confirme se o usuário está ativo no Supabase Auth.

- Usuário sem profile:
  - Valide existência do registro em `profiles`.
  - Para prestadores, valide `provider_profiles`.

- Prestador não ativo:
  - Confira `provider_profiles.status` (`active` vs `pending_verification`/`suspended`).

- Serviço não vinculado ao prestador:
  - Verifique `provider_services` com `active=true` para o `service_id` esperado.

- RLS/policy bloqueando operação:
  - Revise policies e permissões das tabelas usadas no fluxo.
  - Compare o usuário autenticado do teste com o dono esperado do recurso.

## Observações práticas

- Os testes usam dados com prefixo `[TEST]` para isolamento e limpeza segura.
- Em caso de ambiente parcial (ex.: sem alguns usuários), parte das suítes pode ser pulada por guardas de setup.
- Para investigar um arquivo específico:

```bash
npm test -- tests/requests.test.ts
```
