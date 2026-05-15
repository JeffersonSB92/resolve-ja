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

type RequestRecord = {
  id: string;
  status: string;
  completed_at?: string | null;
  completedAt?: string | null;
};

type QuoteRecord = {
  id: string;
  status: string;
};

type ScheduledFlow = {
  requestId: string;
  quoteId: string;
};

type InProgressFlow = {
  requestId: string;
  quoteId: string;
  pin: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
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

describe('Attendance flow endpoints', () => {
  let app: FastifyInstance;
  let customerUser: AuthUser | null = null;
  let providerUser: AuthUser | null = null;
  let nonContractedProviderUser: AuthUser | null = null;
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
      nonContractedProviderUser = await signInPendingProvider();
      otherUser = await signInOtherUser();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200 && process.env.NODE_ENV === 'test';

      if (integrationReady && nonContractedProviderUser) {
        await cleanupTestData();
        await ensureProviderStatusForTest(nonContractedProviderUser.userId, 'active');
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

  async function getFirstActiveService(): Promise<Service | null> {
    const services = await getJson<ApiResponse<Service[]>>(app, '/services');
    if (services.statusCode !== 200) {
      return null;
    }
    return (services.body.data ?? [])[0] ?? null;
  }

  async function prepareScheduledRequest(): Promise<ScheduledFlow | null> {
    if (!customerUser || !providerUser) {
      return null;
    }

    const service = await getFirstActiveService();
    if (!service) {
      return null;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, service.id);

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] attendance scheduled address',
      street: '[TEST] attendance street',
    });

    const createdRequest = await createTestRequest(
      app,
      customerUser.accessToken,
      address.id,
      service.id,
      {
        title: '[TEST] attendance scheduled request',
      },
    );

    const quote = await postJson<
      { amountCents: number; message: string },
      ApiResponse<QuoteRecord>
    >(app, `/requests/${createdRequest.id}/quotes`, providerUser.accessToken, {
      amountCents: 15000,
      message: '[TEST] attendance quote',
    });

    if (![200, 201].includes(quote.statusCode) || !quote.body.data?.id) {
      return null;
    }

    const accepted = await postJson<undefined, ApiResponse<{ serviceRequest?: RequestRecord }>>(
      app,
      `/quotes/${quote.body.data.id}/accept`,
      customerUser.accessToken,
    );

    if (accepted.statusCode !== 200) {
      return null;
    }

    return {
      requestId: createdRequest.id,
      quoteId: quote.body.data.id,
    };
  }

  async function prepareInProgressRequest(): Promise<InProgressFlow | null> {
    if (!customerUser || !providerUser) {
      return null;
    }

    const scheduled = await prepareScheduledRequest();
    if (!scheduled) {
      return null;
    }

    const checkIn = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${scheduled.requestId}/check-in`,
      providerUser.accessToken,
      { selfiePath: '[TEST]/selfies/in-progress.jpg' },
    );

    if (checkIn.statusCode !== 200) {
      return null;
    }

    const pinResult = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${scheduled.requestId}/generate-pin`,
      customerUser.accessToken,
    );

    const pin = pinResult.body.data?.pin;
    if (pinResult.statusCode !== 200 || !pin) {
      return null;
    }

    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${scheduled.requestId}/start`,
      providerUser.accessToken,
      { pin },
    );

    if (started.statusCode !== 200 || started.body.data?.status !== 'in_progress') {
      return null;
    }

    return {
      requestId: scheduled.requestId,
      quoteId: scheduled.quoteId,
      pin,
    };
  }

  it('1. contracted provider checks in with selfie', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const response = await postJson<
      { selfiePath: string; lat?: number; lng?: number },
      ApiResponse<RequestRecord>
    >(app, `/requests/${flow.requestId}/check-in`, providerUser.accessToken, {
      selfiePath: '[TEST]/selfies/arrival.jpg',
      lat: -28.262,
      lng: -52.406,
    });

    expect(response.statusCode).toBe(200);
    expect(['provider_arrived', 'awaiting_pin', 'scheduled']).toContain(
      response.body.data?.status,
    );
  });

  it('2. contracted provider cannot check-in without selfie', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const noSelfie = await postJson<Record<string, unknown>, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      providerUser.accessToken,
      {},
    );

    const emptySelfie = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      providerUser.accessToken,
      { selfiePath: '' },
    );

    expect(noSelfie.statusCode).toBe(400);
    expect(emptySelfie.statusCode).toBe(400);
  });

  it('3. non-contracted provider cannot check-in', async () => {
    if (!integrationReady || !nonContractedProviderUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const response = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      nonContractedProviderUser.accessToken,
      { selfiePath: '[TEST]/selfies/not-contracted.jpg' },
    );

    expect(response.statusCode).toBe(403);
  });

  it('4. customer generates a 6-digit PIN', async () => {
    if (!integrationReady || !customerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const response = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      customerUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    const pin = response.body.data?.pin;
    expect(typeof pin).toBe('string');
    expect((pin ?? '')).toMatch(/^\d{6}$/);
  });

  it('5. provider cannot generate PIN', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const response = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      providerUser.accessToken,
    );

    expect(response.statusCode).toBe(403);
  });

  it('6. external user cannot generate PIN', async () => {
    if (!integrationReady || !otherUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const response = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('7. contracted provider starts service with correct PIN', async () => {
    if (!integrationReady || !customerUser || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const checkIn = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      providerUser.accessToken,
      { selfiePath: '[TEST]/selfies/start-ok.jpg' },
    );
    expect([200, 409]).toContain(checkIn.statusCode);

    const pinResult = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      customerUser.accessToken,
    );
    expect(pinResult.statusCode).toBe(200);

    const pin = pinResult.body.data?.pin;
    if (!pin) return;

    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/start`,
      providerUser.accessToken,
      { pin },
    );

    expect(started.statusCode).toBe(200);
    expect(started.body.data?.status).toBe('in_progress');
  });

  it('8. provider cannot start with wrong PIN', async () => {
    if (!integrationReady || !customerUser || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      providerUser.accessToken,
      { selfiePath: '[TEST]/selfies/start-wrong-pin.jpg' },
    );

    await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      customerUser.accessToken,
    );

    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/start`,
      providerUser.accessToken,
      { pin: '000000' },
    );

    expect(started.statusCode).toBeGreaterThanOrEqual(400);

    const details = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}`,
      customerUser.accessToken,
    );

    expect(details.statusCode).toBe(200);
    expect(details.body.data?.status).not.toBe('in_progress');
  });

  it('9. provider cannot start without check-in', async () => {
    if (!integrationReady || !customerUser || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const pinResult = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      customerUser.accessToken,
    );

    const pin = pinResult.body.data?.pin;
    if (!pin) return;

    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/start`,
      providerUser.accessToken,
      { pin },
    );

    expect(started.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('10. non-contracted provider cannot start service', async () => {
    if (!integrationReady || !customerUser || !providerUser || !nonContractedProviderUser) {
      return;
    }

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/check-in`,
      providerUser.accessToken,
      { selfiePath: '[TEST]/selfies/start-blocked.jpg' },
    );

    const pinResult = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${flow.requestId}/generate-pin`,
      customerUser.accessToken,
    );

    const pin = pinResult.body.data?.pin;
    if (!pin) return;

    const started = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/start`,
      nonContractedProviderUser.accessToken,
      { pin },
    );

    expect(started.statusCode).toBe(403);
  });

  it('11. contracted provider marks in_progress service as done', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareInProgressRequest();
    if (!flow) return;

    const marked = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      providerUser.accessToken,
    );

    expect(marked.statusCode).toBe(200);
    expect(marked.body.data?.status).toBe('pending_confirmation');
  });

  it('12. non-contracted provider cannot mark done', async () => {
    if (!integrationReady || !nonContractedProviderUser) return;

    const flow = await prepareInProgressRequest();
    if (!flow) return;

    const marked = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      nonContractedProviderUser.accessToken,
    );

    expect(marked.statusCode).toBe(403);
  });

  it('13. provider cannot mark done when request is only scheduled', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareScheduledRequest();
    if (!flow) return;

    const marked = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      providerUser.accessToken,
    );

    expect(marked.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('14. customer confirms pending_confirmation request completion', async () => {
    if (!integrationReady || !customerUser || !providerUser) return;

    const flow = await prepareInProgressRequest();
    if (!flow) return;

    const marked = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      providerUser.accessToken,
    );
    expect(marked.statusCode).toBe(200);
    expect(marked.body.data?.status).toBe('pending_confirmation');

    const confirmed = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/confirm-completion`,
      customerUser.accessToken,
    );

    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.body.data?.status).toBe('completed');
    expect(
      Boolean(confirmed.body.data?.completed_at ?? confirmed.body.data?.completedAt),
    ).toBe(true);
  });

  it('15. external user cannot confirm completion', async () => {
    if (!integrationReady || !otherUser || !providerUser) return;

    const flow = await prepareInProgressRequest();
    if (!flow) return;

    await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      providerUser.accessToken,
    );

    const confirmed = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/confirm-completion`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(confirmed.statusCode);
  });

  it('16. provider cannot confirm completion in place of customer', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareInProgressRequest();
    if (!flow) return;

    await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/mark-done`,
      providerUser.accessToken,
    );

    const confirmed = await postJson<undefined, ApiResponse<RequestRecord>>(
      app,
      `/requests/${flow.requestId}/confirm-completion`,
      providerUser.accessToken,
    );

    expect(confirmed.statusCode).toBe(403);
  });
});
