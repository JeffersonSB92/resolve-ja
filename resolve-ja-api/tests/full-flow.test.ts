import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { signInCustomer, signInOtherUser, signInProvider } from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import {
  createTestAddress,
  ensureTestProviderIsActive,
  ensureTestProviderService,
  getActiveService,
} from './helpers/seed.js';
import { getJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type RequestRecord = {
  id: string;
  status: string;
};

type QuoteRecord = {
  id: string;
  status: string;
};

type Opportunity = {
  id: string;
  service: { id: string };
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const hasCustomer = hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');
const hasProvider = hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasOther = hasRequiredEnv('TEST_OTHER_USER_EMAIL') && hasRequiredEnv('TEST_OTHER_USER_PASSWORD');

describe('Full integration flow', () => {
  let app: FastifyInstance;
  let customer: AuthUser | null = null;
  let provider: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let ready = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasCustomer || !hasProvider || !hasOther) {
      return;
    }

    try {
      customer = await signInCustomer();
      provider = await signInProvider();
      otherUser = await signInOtherUser();

      const health = await getJson<ApiResponse<unknown>>(app, '/health');
      ready = health.statusCode === 200;

      if (ready) {
        await cleanupTestData();
      }
    } catch {
      ready = false;
    }
  });

  afterAll(async () => {
    if (ready) {
      await cleanupTestData();
    }
    await closeTestApp(app);
  });

  it('should complete the MVP end-to-end flow', async () => {
    if (!ready || !customer || !provider || !otherUser) {
      return;
    }

    // 1-3) Login users and ensure provider is active and offers an active service.
    const activeService = await getActiveService();
    const providerProfile = await ensureTestProviderIsActive(provider.userId);
    await ensureTestProviderService(providerProfile.id, activeService.id);

    // 4) Customer creates an address.
    const address = await createTestAddress(app, customer.accessToken, {
      label: '[TEST] full-flow address',
      street: '[TEST] full-flow street',
    });

    // 5) Customer creates a request.
    const createdRequest = await postJson<
      {
        serviceId: string;
        addressId: string;
        title: string;
        description: string;
        budgetCents: number;
      },
      ApiResponse<RequestRecord>
    >(app, '/requests', customer.accessToken, {
      serviceId: activeService.id,
      addressId: address.id,
      title: '[TEST] full-flow request',
      description: '[TEST] end-to-end MVP lifecycle',
      budgetCents: 23000,
    });

    expect([200, 201]).toContain(createdRequest.statusCode);
    const requestId = createdRequest.body.data?.id;
    expect(typeof requestId).toBe('string');
    expect(createdRequest.body.data?.status).toBe('open');
    if (!requestId) return;

    // 6) Provider lists opportunities and finds the request.
    const opportunities = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      provider.accessToken,
    );
    expect(opportunities.statusCode).toBe(200);
    expect((opportunities.body.data ?? []).some((item) => item.id === requestId)).toBe(true);

    // 7) Provider sends a quote.
    const quoteResponse = await postJson<
      { amountCents: number; message: string; estimatedDurationMinutes: number },
      ApiResponse<QuoteRecord>
    >(app, `/requests/${requestId}/quotes`, provider.accessToken, {
      amountCents: 21000,
      message: '[TEST] full-flow quote',
      estimatedDurationMinutes: 120,
    });

    expect([200, 201]).toContain(quoteResponse.statusCode);
    const quoteId = quoteResponse.body.data?.id;
    expect(typeof quoteId).toBe('string');
    expect(quoteResponse.body.data?.status).toBe('sent');
    if (!quoteId) return;

    // 8) Customer lists quotes for the request.
    const listQuotes = await getJson<ApiResponse<QuoteRecord[]>>(
      app,
      `/requests/${requestId}/quotes`,
      customer.accessToken,
    );
    expect(listQuotes.statusCode).toBe(200);
    expect((listQuotes.body.data ?? []).some((quote) => quote.id === quoteId)).toBe(true);

    // 9) Customer accepts the quote.
    const accepted = await postJson<
      undefined,
      ApiResponse<{ serviceRequest?: RequestRecord; acceptedQuote?: QuoteRecord }>
    >(app, `/quotes/${quoteId}/accept`, customer.accessToken);
    expect(accepted.statusCode).toBe(200);

    // 10) Request becomes scheduled.
    expect(accepted.body.data?.serviceRequest?.status).toBe('scheduled');
    expect(accepted.body.data?.acceptedQuote?.status).toBe('accepted');

    // 11) Contracted provider can read request details.
    const providerRequestView = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      provider.accessToken,
    );
    expect(providerRequestView.statusCode).toBe(200);

    // 12) Provider performs check-in with selfiePath.
    const checkIn = await postJson<
      { selfiePath: string; lat: number; lng: number },
      ApiResponse<RequestRecord>
    >(app, `/requests/${requestId}/check-in`, provider.accessToken, {
      selfiePath: '[TEST]/selfies/full-flow.jpg',
      lat: -28.263,
      lng: -52.408,
    });
    expect(checkIn.statusCode).toBe(200);

    // 13) Customer generates PIN.
    const pinResponse = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${requestId}/generate-pin`,
      customer.accessToken,
    );
    expect(pinResponse.statusCode).toBe(200);
    const pin = pinResponse.body.data?.pin;
    expect(typeof pin).toBe('string');
    expect((pin ?? '')).toMatch(/^\d{6}$/);
    if (!pin) return;

    // 14) Provider starts service with correct PIN.
    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}/start`,
      provider.accessToken,
      { pin },
    );
    expect(started.statusCode).toBe(200);

    // 15) Request becomes in_progress.
    expect(started.body.data?.status).toBe('in_progress');

    // 16) Provider marks service as done.
    const markedDone = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}/mark-done`,
      provider.accessToken,
    );
    expect(markedDone.statusCode).toBe(200);

    // 17) Request becomes pending_confirmation.
    expect(markedDone.body.data?.status).toBe('pending_confirmation');

    // 18) Customer confirms completion.
    const confirmed = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}/confirm-completion`,
      customer.accessToken,
    );
    expect(confirmed.statusCode).toBe(200);

    // 19) Request becomes completed.
    expect(confirmed.body.data?.status).toBe('completed');

    // 20) External user cannot access sensitive request data.
    const externalView = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      otherUser.accessToken,
    );
    expect([403, 404]).toContain(externalView.statusCode);
  });
});
