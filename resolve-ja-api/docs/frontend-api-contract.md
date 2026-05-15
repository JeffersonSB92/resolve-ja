# ResolveJá API - Contrato Frontend/Backend

Fonte: auditoria de `src/app.ts`, `src/modules/**`, `postman/resolveja-api.postman_collection.json` e testes em `tests/**`.

## 1) Padrão global de resposta de sucesso

A API usa envelope padrão:

```json
{
  "success": true,
  "message": "opcional",
  "data": {}
}
```

- `successResponse(...)` retorna HTTP `200`.
- `createdResponse(...)` retorna HTTP `201`.
- Alguns endpoints de criação usam `201` (`providers/profile`, `providers/me/services`, `requests`, `requests/:id/quotes`, `requests/:id/messages`).

## 2) Padrão global de resposta de erro

Envelope de erro:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "mensagem",
    "details": {}
  }
}
```

- `details` é opcional.
- Erros comuns:
  - `401 UNAUTHORIZED`
  - `403 FORBIDDEN`
  - `404 NOT_FOUND`
  - `409` de conflito de regra de negócio
  - `400 VALIDATION_ERROR`
  - `500 INTERNAL_SERVER_ERROR`

## 3) Autenticação Bearer token

- Header obrigatório em rotas protegidas:
  - `Authorization: Bearer <access_token>`
- Login:
  - `POST /auth/login`
  - Body: `{ "email": string(email), "password": string(min 6) }`
  - Retorna `accessToken`, `refreshToken`, `expiresIn`, `tokenType`, `user`.
- Endpoint de sessão:
  - `GET /me` (autenticado)

## 4) Endpoints existentes por módulo

## auth/me

### POST `/auth/login`
- Auth: não
- Perfil: n/a
- Body:
```json
{ "email": "user@example.com", "password": "password123" }
```
- Response `200`:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "token",
    "expiresIn": 3600,
    "tokenType": "bearer",
    "user": { "id": "uuid", "email": "user@example.com" }
  }
}
```
- Principais erros: `401 UNAUTHORIZED` (credenciais inválidas), `400 VALIDATION_ERROR`.

### GET `/me`
- Auth: sim
- Perfil: qualquer usuário autenticado
- Body: n/a
- Response `200`: `MeResponse`
- Principais erros: `401 UNAUTHORIZED`.

## catalog

### GET `/categories`
- Auth: não
- Perfil: n/a
- Query/body: n/a
- Response `200`: `ServiceCategory[]`
- Erros: `500 INTERNAL_SERVER_ERROR`.

### GET `/services`
- Auth: não
- Perfil: n/a
- Query: `categoryId?: string`
- Response `200`: `Service[]`
- Erros: `400 VALIDATION_ERROR`, `500 INTERNAL_SERVER_ERROR`.

### GET `/services/:id`
- Auth: não
- Perfil: n/a
- Params: `id: string`
- Response `200`: `Service`
- Erros: `404 NOT_FOUND` (Service), `500 INTERNAL_SERVER_ERROR`.

## addresses

### POST `/addresses`
- Auth: sim
- Perfil: usuário autenticado
- Body:
```json
{
  "label": "string|null opcional",
  "postalCode": "string opcional",
  "state": "string",
  "city": "string",
  "neighborhood": "string|null opcional",
  "street": "string",
  "number": "string|null opcional",
  "complement": "string|null opcional",
  "lat": 0,
  "lng": 0,
  "isDefault": true
}
```
- Response `200`: `Address`
- Erros: `401`, `400 VALIDATION_ERROR`, `500`.

### GET `/addresses`
- Auth: sim
- Perfil: usuário autenticado
- Response `200`: `Address[]`
- Erros: `401`, `500`.

### GET `/addresses/:id`
- Auth: sim
- Perfil: dono do endereço
- Response `200`: `Address`
- Erros: `401`, `404 NOT_FOUND` (Address), `500`.

### PATCH `/addresses/:id`
- Auth: sim
- Perfil: dono do endereço
- Body: mesmos campos de criação, todos opcionais; pelo menos 1 campo
- Response `200`: `Address`
- Erros: `401`, `400 VALIDATION_ERROR`, `404`, `500`.

### DELETE `/addresses/:id`
- Auth: sim
- Perfil: dono do endereço
- Response `200`: `{ "deleted": true }`
- Erros: `401`, `404`, `409 ADDRESS_LINKED_TO_ACTIVE_REQUEST`, `500`.

## providers

### POST `/providers/profile`
- Auth: sim
- Perfil: usuário autenticado sem perfil prévio
- Body:
```json
{
  "displayName": "string",
  "bio": "string|null opcional",
  "baseState": "string",
  "baseCity": "string",
  "baseNeighborhood": "string|null opcional",
  "serviceRadiusKm": 10
}
```
- Response `201`: `ProviderProfile` (status inicial `pending_verification`)
- Erros: `401`, `409 PROVIDER_PROFILE_ALREADY_EXISTS`, `400 VALIDATION_ERROR`, `500`.

### GET `/providers/me`
- Auth: sim
- Perfil: prestador com perfil
- Response `200`: `ProviderProfile`
- Erros: `401`, `404 NOT_FOUND` (Provider profile), `500`.

### PATCH `/providers/me`
- Auth: sim
- Perfil: prestador com perfil
- Body: campos de perfil opcionais; pelo menos 1
- Response `200`: `ProviderProfile`
- Erros: `401`, `400 VALIDATION_ERROR`, `404`, `500`.

### GET `/providers/available-requests`
- Auth: sim
- Perfil: prestador ativo (`status=active`)
- Query: `serviceId?: uuid`, `city?: string`, `neighborhood?: string`
- Response `200`: lista de oportunidades (subset de `ServiceRequest` com dados mascarados)
- Erros: `401`, `403 FORBIDDEN` (perfil não ativo), `404` (sem perfil), `500`.

### POST `/providers/me/services`
- Auth: sim
- Perfil: prestador com perfil
- Body:
```json
{
  "serviceId": "uuid",
  "basePriceCents": 10000,
  "priceNotes": "string|null opcional"
}
```
- Response `201`: vínculo serviço-prestador
- Erros: `401`, `404 Service/Provider profile`, `409 PROVIDER_SERVICE_ALREADY_EXISTS`, `400`, `500`.

### GET `/providers/me/services`
- Auth: sim
- Perfil: prestador com perfil
- Response `200`: vínculos serviço-prestador[]
- Erros: `401`, `404 Provider profile`, `500`.

### PATCH `/providers/me/services/:serviceId`
- Auth: sim
- Perfil: prestador com perfil
- Body: `basePriceCents?`, `priceNotes?`, `active?` (>=1 campo)
- Response `200`: vínculo atualizado
- Erros: `401`, `404 Service/Provider service`, `400`, `500`.

### DELETE `/providers/me/services/:serviceId`
- Auth: sim
- Perfil: prestador com perfil
- Response `200`: `{ "deleted": true }`
- Erros: `401`, `404 Service/Provider service`, `500`.

## requests

### POST `/requests`
- Auth: sim
- Perfil: cliente autenticado
- Body:
```json
{
  "serviceId": "uuid",
  "addressId": "uuid",
  "title": "string",
  "description": "string|null opcional",
  "desiredStartAt": "ISO datetime opcional",
  "desiredEndAt": "ISO datetime opcional",
  "budgetCents": 10000
}
```
- Response `201`: `ServiceRequest`
- Erros: `401`, `404 Service/Address`, `400 VALIDATION_ERROR`, `500`.

### GET `/requests/my`
- Auth: sim
- Perfil: cliente autenticado
- Query: `status?: open|scheduled|in_progress|provider_arrived|awaiting_pin|completed|canceled|disputed`
- Response `200`: `ServiceRequest[]`
- Erros: `401`, `400`, `500`.

### GET `/requests/:id`
- Auth: sim
- Perfil: admin, dono da request, prestador participante
- Response `200`: `ServiceRequest`
- Regras: prestador não contratado pode receber dados de endereço mascarados
- Erros: `401`, `403`, `404`, `500`.

### PATCH `/requests/:id`
- Auth: sim
- Perfil: dono da request
- Body: `title?`, `description?`, `desiredStartAt?`, `desiredEndAt?`, `budgetCents?` (>=1)
- Response `200`: `ServiceRequest`
- Erros: `401`, `403`, `409 REQUEST_NOT_EDITABLE`, `400`, `500`.

### POST `/requests/:id/cancel`
- Auth: sim
- Perfil: dono da request
- Body: `{ "reason": "string opcional" }`
- Response `200`: `ServiceRequest` cancelada
- Erros: `401`, `403`, `409 REQUEST_NOT_CANCELABLE|CANCEL_NOT_ALLOWED`, `500`.

## quotes

### POST `/requests/:id/quotes`
- Auth: sim
- Perfil: prestador ativo
- Body:
```json
{
  "amountCents": 15000,
  "message": "string opcional",
  "estimatedDurationMinutes": 120,
  "validUntil": "ISO datetime opcional"
}
```
- Response `201`: `Quote`
- Erros: `401`, `403` (não oferece serviço / perfil não ativo), `404 Request/Provider profile`, `409 REQUEST_NOT_OPEN|QUOTE_ALREADY_EXISTS`, `400`, `500`.

### GET `/requests/:id/quotes`
- Auth: sim
- Perfil: dono da request, admin, ou prestador que tenha cotado
- Response `200`: `Quote[]` (prestador vê apenas sua própria cotação)
- Erros: `401`, `403`, `404`, `500`.

### GET `/providers/me/quotes`
- Auth: sim
- Perfil: prestador com perfil
- Query: `status?: sent|accepted|rejected|withdrawn|expired|canceled`
- Response `200`: `Quote[]`
- Erros: `401`, `404`, `400`, `500`.

### POST `/quotes/:id/withdraw`
- Auth: sim
- Perfil: dono da cotação (prestador)
- Body: n/a
- Response `200`: `Quote` com status `withdrawn`
- Erros: `401`, `403`, `404 Quote`, `409 QUOTE_WITHDRAW_NOT_ALLOWED`, `500`.

### POST `/quotes/:id/accept`
- Auth: sim
- Perfil: dono da request (cliente)
- Body: n/a
- Response `200`:
```json
{
  "success": true,
  "data": {
    "serviceRequest": {},
    "acceptedQuote": {},
    "payment": {}
  }
}
```
- Erros: `401`, `403` (inclui provider aceitando própria quote), `404`, `409 REQUEST_NOT_OPEN|QUOTE_NOT_ACCEPTABLE`, `500`.

## attendance / check-in / PIN

### POST `/requests/:id/check-in`
- Auth: sim
- Perfil: prestador atribuído à request
- Body:
```json
{ "selfiePath": "string", "lat": 0, "lng": 0 }
```
- Response `200`: `ServiceRequest` atualizada
- Erros: `401`, `403`, `404 Provider profile/Request`, `409 REQUEST_NOT_SCHEDULED`, `400`, `500`.

### POST `/requests/:id/generate-pin`
- Auth: sim
- Perfil: dono da request
- Body: `{}`
- Response `200`: `{ "pin": "string" }`
- Erros: `401`, `403`, `404`, `409 REQUEST_STATUS_INVALID_FOR_PIN`, `500`.

### POST `/requests/:id/start`
- Auth: sim
- Perfil: prestador atribuído
- Body: `{ "pin": "string" }`
- Response `200`: `ServiceRequest` atualizada
- Erros: `401`, `403`, `404`, `400`, `500`.

### POST `/requests/:id/mark-done`
- Auth: sim
- Perfil: prestador atribuído
- Body: n/a
- Response `200`: `ServiceRequest` atualizada
- Erros: `401`, `403`, `404`, `409 REQUEST_NOT_IN_PROGRESS`, `500`.

### POST `/requests/:id/confirm-completion`
- Auth: sim
- Perfil: dono da request
- Body: n/a
- Response `200`: `ServiceRequest` atualizada
- Erros: `401`, `403`, `404`, `409 REQUEST_STATUS_INVALID_FOR_COMPLETION`, `500`.

## messages

### POST `/requests/:id/messages`
- Auth: sim
- Perfil: participante da request (cliente, prestador participante, admin)
- Body:
```json
{ "body": "string opcional", "attachmentPath": "string|null opcional" }
```
- Regra: pelo menos `body` ou `attachmentPath`
- Response `201`: `Message`
- Erros: `401`, `403`, `404 Request`, `400`, `500`.

### GET `/requests/:id/messages`
- Auth: sim
- Perfil: participante da request (cliente, prestador participante, admin)
- Response `200`: `Message[]`
- Erros: `401`, `403`, `404`, `500`.

## admin

Todas as rotas abaixo exigem `app.authenticate` + `app.requireAdmin`.

### GET `/admin/providers/pending`
- Auth: sim
- Perfil: admin
- Response `200`: lista de `ProviderProfile` pendentes (`pending_verification`/`under_review`) com dados de `profiles`
- Erros: `401`, `403`, `500`.

### POST `/admin/providers/:id/approve`
- Auth: sim
- Perfil: admin
- Body: `{ "note": "string opcional" }` (validado, mas não persistido)
- Response `200`: `ProviderProfile` com `status=active`
- Erros: `401`, `403`, `404`, `400`, `500`.

### POST `/admin/providers/:id/reject`
- Auth: sim
- Perfil: admin
- Body: `{ "reason": "string opcional" }` (validado, mas não persistido)
- Response `200`: `ProviderProfile` com `status=rejected`
- Erros: `401`, `403`, `404`, `400`, `500`.

### POST `/admin/providers/:id/suspend`
- Auth: sim
- Perfil: admin
- Body: `{ "reason": "string opcional" }` (validado, mas não persistido)
- Response `200`: `ProviderProfile` com `status=suspended`
- Erros: `401`, `403`, `404`, `400`, `500`.

### GET `/admin/requests`
- Auth: sim
- Perfil: admin
- Query: `status?: string`
- Response `200`: `ServiceRequest[]`
- Erros: `401`, `403`, `500`.

### GET `/admin/reports`
- Auth: sim
- Perfil: admin
- Query: `status?: string`
- Response `200`: `Report[]`
- Erros: `401`, `403`, `500`.

## 5) Tipos principais (contrato real observado)

## MeResponse

```ts
type MeResponse = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  roles: string[];
  isAdmin: boolean;
  providerProfile: ProviderProfile | null;
};
```

## Profile

```ts
type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};
```

## ProviderProfile

```ts
type ProviderProfile = {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string | null;
  base_state?: string;
  base_city?: string;
  base_neighborhood?: string | null;
  service_radius_km?: number | null;
  status?: string;
  verified_at?: string | null;
  average_rating?: number | null;
  rating_count?: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};
```

## ServiceCategory

```ts
type ServiceCategory = {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
};
```

## Service

```ts
type Service = {
  id: string;
  category_id: string | null;
  name: string | null;
  description: string | null;
  base_price: number | null;
  active: boolean;
  [key: string]: unknown;
};
```

## Address

```ts
type Address = {
  id: string;
  user_id: string;
  label: string | null;
  postal_code: string | null;
  state: string;
  city: string;
  neighborhood: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  [key: string]: unknown;
};
```

## ServiceRequest

```ts
type ServiceRequest = {
  id: string;
  requester_id: string;
  service_id: string;
  address_id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_provider_id: string | null;
  accepted_quote_id: string | null;
  desired_start_at: string | null;
  desired_end_at: string | null;
  budget_cents: number | null;
  location_state: string | null;
  location_city: string | null;
  location_neighborhood: string | null;
  cancelled_at: string | null;
  created_at: string;
  [key: string]: unknown;
};
```

## Quote

```ts
type Quote = {
  id: string;
  request_id: string;
  provider_id: string;
  amount_cents: number;
  message: string | null;
  estimated_duration_minutes: number | null;
  valid_until: string | null;
  status: string;
  created_at: string;
  [key: string]: unknown;
};
```

## Payment

```ts
type Payment = Record<string, unknown> | null;
```

## Message

```ts
type Message = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  created_at: string;
  [key: string]: unknown;
};
```

## Report

```ts
type Report = Record<string, unknown>;
```

## Pendências para a API

Necessidades comuns da web que **não existem como endpoint dedicado** hoje:

- `POST /auth/refresh` para renovar `accessToken` via `refreshToken`.
- `POST /auth/logout` (revogação de sessão/token).
- CRUD de perfil de usuário (`/profile`) separado de `/me`.
- Endpoints para upload/URL assinada de arquivos (ex.: selfie, anexos), hoje apenas paths são aceitos.
- Endpoints de pagamento padronizados (listar/capturar/estado) além do retorno indireto em `accept quote`.
- Endpoint de notificações (lista/marcar lida) para eventos de fluxo.

Observação: `/health` existe e responde `200`, mas não foi incluído nos grupos funcionais acima por não ser endpoint de produto para UI.
