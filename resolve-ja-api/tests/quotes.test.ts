import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import {
  signInCustomer,
  signInOtherUser,
  signInPendingProvider,
  signInProvider,
} from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import {
  createTestAddress,
  createTestRequest,
  ensureProviderStatusForTest,
  ensureTestProviderIsActive,
  ensureTestProviderService,
} from './helpers/seed.js';
import { getJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type Service = {
  id: string;
};

type QuoteRecord = {
  id: string;
  request_id: string;
  provider_id: string;
  amount_cents: number;
  message: string | null;
  status: 'sent' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'canceled';
};

type RequestRecord = {
  id: string;
  status: string;
};

type AcceptQuoteResponse = {
  serviceRequest?: RequestRecord;
  acceptedQuote?: QuoteRecord;
  payment?: Record<string, unknown> | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type QuotePayload = {
  amountCents: number;
  message?: string;
  estimatedDurationMinutes?: number;
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

async function createOpenRequestForService(
  app: FastifyInstance,
  customerToken: string,
  serviceId: string,
  title: string,
): Promise<RequestRecord> {
  const address = await createTestAddress(app, customerToken, {
    label: `[TEST] ${title} address`,
    street: `[TEST] ${title} street`,
  });

  const request = await createTestRequest(app, customerToken, address.id, serviceId, {
    title,
    description: `[TEST] ${title} description`,
  });

  return {
    id: request.id,
    status: 'open',
  };
}

async function getAvailableServices(app: FastifyInstance): Promise<Service[]> {
  const response = await getJson<ApiResponse<Service[]>>(app, '/services');
  if (response.statusCode !== 200) {
    return [];
  }
  return response.body.data ?? [];
}

const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');
const hasProviderCredentials =
  hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasPendingProviderCredentials =
  hasRequiredEnv('TEST_PENDING_PROVIDER_EMAIL') &&
  hasRequiredEnv('TEST_PENDING_PROVIDER_PASSWORD');
const hasOtherUserCredentials =
  hasRequiredEnv('TEST_OTHER_USER_EMAIL') && hasRequiredEnv('TEST_OTHER_USER_PASSWORD');

describe('Quotes endpoints', () => {
  let app: FastifyInstance;
  let customerUser: AuthUser | null = null;
  let providerUser: AuthUser | null = null;
  let pendingProviderUser: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let integrationReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (
      !hasCustomerCredentials ||
      !hasProviderCredentials ||
      !hasPendingProviderCredentials ||
      !hasOtherUserCredentials
    ) {
      return;
    }

    try {
      customerUser = await signInCustomer();
      providerUser = await signInProvider();
      pendingProviderUser = await signInPendingProvider();
      otherUser = await signInOtherUser();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200 && process.env.NODE_ENV === 'test';

      if (integrationReady) {
        await cleanupTestData();
      }
    } catch {
      integrationReady = false;
    }
  });

  afterAll(async () => {
    if (integrationReady) {
      await cleanupTestData();
    }
    await closeTestApp(app);
  });

  it('1. active compatible provider sends quote with status sent', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote create sent',
    );

    const response = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: 18000,
        message: '[TEST] initial quote',
      },
    );

    expect([200, 201]).toContain(response.statusCode);
    expect(response.body.data?.status).toBe('sent');
  });

  it('2. pending provider cannot send quote', async () => {
    if (!integrationReady || !customerUser || !pendingProviderUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const pendingProfile = await ensureProviderStatusForTest(
      pendingProviderUser.userId,
      'pending_verification',
    );
    await ensureTestProviderService(pendingProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote pending blocked',
    );

    const response = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      pendingProviderUser.accessToken,
      {
        amountCents: 17000,
      },
    );

    expect(response.statusCode).toBe(403);
  });

  it('3. incompatible provider cannot send quote', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    if (services.length < 2) {
      return;
    }

    const serviceX = services[0] as Service;
    const serviceY = services[1] as Service;

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, serviceY.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      serviceX.id,
      '[TEST] quote incompatible blocked',
    );

    const response = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: 22000,
      },
    );

    expect([400, 403]).toContain(response.statusCode);
  });

  it('4. provider cannot send duplicated quote', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote duplicate blocked',
    );

    const first = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: 15500,
      },
    );
    expect([200, 201]).toContain(first.statusCode);

    const second = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: 16500,
      },
    );

    expect(second.statusCode).toBe(409);
  });

  it('5. should reject zero or negative quote amount', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote amount validation',
    );

    const zeroAttempt = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: 0,
      },
    );

    const negativeAttempt = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      {
        amountCents: -100,
      },
    );

    expect(zeroAttempt.statusCode).toBe(400);
    expect(negativeAttempt.statusCode).toBe(400);
  });

  it('6. customer lists quotes from own request', async () => {
    if (!integrationReady || !customerUser || !providerUser || !pendingProviderUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerA = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerA.id, service.id);

    const providerB = await ensureProviderStatusForTest(
      pendingProviderUser.userId,
      'active',
    );
    await ensureTestProviderService(providerB.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote list customer',
    );

    await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 10000 },
    );

    await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      pendingProviderUser.accessToken,
      { amountCents: 11000 },
    );

    const list = await getJson<ApiResponse<QuoteRecord[]>>(
      app,
      `/requests/${request.id}/quotes`,
      customerUser.accessToken,
    );

    expect(list.statusCode).toBe(200);
    expect((list.body.data ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('7. provider lists only own quote in request quotes endpoint', async () => {
    if (!integrationReady || !customerUser || !providerUser || !pendingProviderUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerA = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerA.id, service.id);

    const providerB = await ensureProviderStatusForTest(
      pendingProviderUser.userId,
      'active',
    );
    await ensureTestProviderService(providerB.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote list provider own',
    );

    const ownQuote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 12000 },
    );

    await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      pendingProviderUser.accessToken,
      { amountCents: 13000 },
    );

    const list = await getJson<ApiResponse<QuoteRecord[]>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
    );

    expect(list.statusCode).toBe(200);
    const quotes = list.body.data ?? [];
    expect(quotes.length).toBe(1);
    expect(quotes[0]?.id).toBe(ownQuote.body.data?.id);
  });

  it('8. external user cannot list quotes from request', async () => {
    if (!integrationReady || !customerUser || !providerUser || !otherUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote list external blocked',
    );

    await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 14000 },
    );

    const list = await getJson<ApiResponse<QuoteRecord[]>>(
      app,
      `/requests/${request.id}/quotes`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(list.statusCode);
  });

  it('9. provider withdraws sent quote', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote withdraw sent',
    );

    const quote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 16000 },
    );

    const withdraw = await postJson<undefined, ApiResponse<QuoteRecord>>(
      app,
      `/quotes/${quote.body.data?.id}/withdraw`,
      providerUser.accessToken,
    );

    expect(withdraw.statusCode).toBe(200);
    expect(withdraw.body.data?.status).toBe('withdrawn');
  });

  it('10. provider cannot withdraw accepted quote', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote withdraw accepted blocked',
    );

    const quote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 17500 },
    );

    await postJson<undefined, ApiResponse<AcceptQuoteResponse>>(
      app,
      `/quotes/${quote.body.data?.id}/accept`,
      customerUser.accessToken,
    );

    const withdraw = await postJson<undefined, ApiResponse<QuoteRecord>>(
      app,
      `/quotes/${quote.body.data?.id}/withdraw`,
      providerUser.accessToken,
    );

    expect(withdraw.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('11. customer accepts quote and request becomes scheduled', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote accept customer',
    );

    const quote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 19000 },
    );

    const accepted = await postJson<undefined, ApiResponse<AcceptQuoteResponse>>(
      app,
      `/quotes/${quote.body.data?.id}/accept`,
      customerUser.accessToken,
    );

    expect(accepted.statusCode).toBe(200);
    expect(accepted.body.data?.serviceRequest?.status).toBe('scheduled');
    expect(accepted.body.data?.acceptedQuote?.status).toBe('accepted');

    const quoteDetails = await getJson<ApiResponse<QuoteRecord[]>>(
      app,
      `/requests/${request.id}/quotes`,
      customerUser.accessToken,
    );

    const acceptedQuote = (quoteDetails.body.data ?? []).find(
      (item) => item.id === quote.body.data?.id,
    );

    expect(acceptedQuote?.status).toBe('accepted');

    const requestDetails = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${request.id}`,
      customerUser.accessToken,
    );

    expect(requestDetails.statusCode).toBe(200);
    expect(requestDetails.body.data?.status).toBe('scheduled');
  });

  it('12. provider cannot accept own quote', async () => {
    if (!integrationReady || !customerUser || !providerUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote self accept blocked',
    );

    const quote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 21000 },
    );

    const accept = await postJson<undefined, ApiResponse<AcceptQuoteResponse>>(
      app,
      `/quotes/${quote.body.data?.id}/accept`,
      providerUser.accessToken,
    );

    expect(accept.statusCode).toBe(403);
  });

  it('13. external user cannot accept quote', async () => {
    if (!integrationReady || !customerUser || !providerUser || !otherUser) {
      return;
    }

    const services = await getAvailableServices(app);
    const service = services[0];
    if (!service) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const request = await createOpenRequestForService(
      app,
      customerUser.accessToken,
      service.id,
      '[TEST] quote external accept blocked',
    );

    const quote = await postJson<QuotePayload, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      providerUser.accessToken,
      { amountCents: 20500 },
    );

    const accept = await postJson<undefined, ApiResponse<AcceptQuoteResponse>>(
      app,
      `/quotes/${quote.body.data?.id}/accept`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(accept.statusCode);
  });
});
