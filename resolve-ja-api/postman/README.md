# ResolveJa API - Postman

## Arquivos
- `resolveja-api.postman_collection.json`
- `resolveja-api.local.postman_environment.json`

## Como importar no Postman
1. Abra o Postman.
2. Clique em **Import**.
3. Importe o arquivo da collection: `postman/resolveja-api.postman_collection.json`.
4. Importe o arquivo de environment: `postman/resolveja-api.local.postman_environment.json`.
5. Selecione o environment **ResolveJa API - Local**.

## Tokens que precisam ser preenchidos manualmente
Preencha no environment:
- `customer_token`
- `provider_token`
- `pending_provider_token`
- `admin_token`
- `other_user_token`

## Como obter tokens via Supabase Auth
Opcao 1 (recomendada): usar `POST /auth/login` da propria API.
1. Execute `POST /auth/login` com email/senha do usuario de teste.
2. Copie `data.accessToken` da resposta.
3. Cole no campo de token correspondente no environment.

Opcao 2: obter direto no Supabase
1. Use o endpoint de login do Supabase Auth (signInWithPassword).
2. Copie o `access_token` da sessao.
3. Use o token no campo correto do environment.

## Ordem recomendada de execucao
1. `00 - Health`
2. `01 - Auth / Me`
3. `02 - Catalog`
4. `03 - Addresses`
5. `04 - Providers`
6. `05 - Provider Services`
7. `06 - Requests`
8. `07 - Provider Opportunities`
9. `08 - Quotes`
10. `09 - Attendance Flow`
11. `10 - Messages`
12. `11 - Admin`
13. `12 - Security Checks`

## Fluxo completo do MVP
A pasta **99 - Full MVP Flow** tem o roteiro completo em 14 requests, do cliente criando solicitacao ate a confirmacao final.
Execute em ordem numerica (1 a 14).

## Variaveis preenchidas automaticamente
Os scripts de teste salvam automaticamente quando possivel:
- `category_id`
- `service_id`
- `address_id`
- `request_id`
- `quote_id`
- `provider_id`
- `pin`
- `message_id`
- `report_id`

Os scripts sao defensivos e tentam ler IDs em:
- `json.data.id`
- `json.data[0].id`
- `json.data.request.id`
- `json.data.quote.id`
- `json.data.payment.id`

## Trocar localhost por IP da rede
Se for testar de outro dispositivo na mesma rede, altere `base_url` no environment.
Exemplo:
- de: `http://localhost:4000`
- para: `http://192.168.0.11:4000`
