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
import { getJson, patchJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type Service = { id: string };

type RequestRecord = {
  id: string;
  status: string;
};

type QuoteRecord = {
  id: string;
  status: string;
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
const hasOther = hasRequiredEnv('TEST_OTHER_USER_EMAIL') && hasRequiredEnv('TEST_OTHER_USER_PASSWORD');
const hasProvider = hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasPending = hasRequiredEnv('TEST_PENDING_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PENDING_PROVIDER_PASSWORD');

describe('Security rules', () => {
  let app: FastifyInstance;
  let customer: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let provider: AuthUser | null = null;
  let pendingProvider: AuthUser | null = null;
  let ready = false;

  beforeAll(async () => {
    app = await createTestApp();
    if (!hasCustomer || !hasOther || !hasProvider || !hasPending) return;

    try {
      customer = await signInCustomer();
      otherUser = await signInOtherUser();
      provider = await signInProvider();
      pendingProvider = await signInPendingProvider();

      const health = await getJson<ApiResponse<unknown>>(app, '/health');
      ready = health.statusCode === 200 && process.env.NODE_ENV === 'test';

      if (ready && pendingProvider) {
        await cleanupTestData();
        await ensureProviderStatusForTest(pendingProvider.userId, 'pending_verification');
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

  async function firstService(): Promise<Service | null> {
    const res = await getJson<ApiResponse<Service[]>>(app, '/services');
    return res.statusCode === 200 ? (res.body.data ?? [])[0] ?? null : null;
  }

  async function scheduledFlow(): Promise<{ requestId: string; quoteId: string; pin: string } | null> {
    if (!customer || !provider) return null;
    const service = await firstService();
    if (!service) return null;

    const profile = await ensureTestProviderIsActive(provider.userId);
    await ensureTestProviderService(profile.id, service.id);

    const address = await createTestAddress(app, customer.accessToken, {
      label: '[TEST] security flow address',
      street: '[TEST] security flow street',
    });

    const request = await createTestRequest(app, customer.accessToken, address.id, service.id, {
      title: '[TEST] security flow request',
    });

    const quote = await postJson<{ amountCents: number }, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${request.id}/quotes`,
      provider.accessToken,
      { amountCents: 18000 },
    );

    if (![200, 201].includes(quote.statusCode) || !quote.body.data?.id) return null;

    const accepted = await postJson<undefined, ApiResponse<unknown>>(
      app,
      `/quotes/${quote.body.data.id}/accept`,
      customer.accessToken,
    );
    if (accepted.statusCode !== 200) return null;

    const checkedIn = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${request.id}/check-in`,
      provider.accessToken,
      { selfiePath: '[TEST]/security/selfie.jpg' },
    );
    if (checkedIn.statusCode !== 200) return null;

    const pinRes = await postJson<undefined, ApiResponse<{ pin?: string }>>(
      app,
      `/requests/${request.id}/generate-pin`,
      customer.accessToken,
    );

    const pin = pinRes.body.data?.pin;
    if (pinRes.statusCode !== 200 || !pin) return null;

    return { requestId: request.id, quoteId: quote.body.data.id, pin };
  }

  it('1. external user cannot access another user address', async () => {
    if (!ready || !customer || !otherUser) return;
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec addr 1' });
    const res = await getJson<ApiResponse<unknown>>(app, `/addresses/${addr.id}`, otherUser.accessToken);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('2. external user cannot access another user request', async () => {
    if (!ready || !customer || !otherUser) return;
    const service = await firstService();
    if (!service) return;
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec req 2' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, service.id, { title: '[TEST] sec req 2' });
    const res = await getJson<ApiResponse<RequestRecord>>(app, `/requests/${req.id}`, otherUser.accessToken);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('3. external user cannot list quotes of another request', async () => {
    if (!ready || !customer || !provider || !otherUser) return;
    const service = await firstService();
    if (!service) return;
    const profile = await ensureTestProviderIsActive(provider.userId);
    await ensureTestProviderService(profile.id, service.id);
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec quotes 3' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, service.id, { title: '[TEST] sec quotes 3' });
    await postJson<{ amountCents: number }, ApiResponse<QuoteRecord>>(app, `/requests/${req.id}/quotes`, provider.accessToken, { amountCents: 10000 });
    const res = await getJson<ApiResponse<QuoteRecord[]>>(app, `/requests/${req.id}/quotes`, otherUser.accessToken);
    expect([403, 404]).toContain(res.statusCode);
  });

  it('4. pending provider cannot list opportunities', async () => {
    if (!ready || !pendingProvider) return;
    const res = await getJson<ApiResponse<unknown[]>>(app, '/providers/available-requests', pendingProvider.accessToken);
    expect([200, 403]).toContain(res.statusCode);
    if (res.statusCode === 200) expect((res.body.data ?? []).length).toBe(0);
  });

  it('5. pending provider cannot send quote', async () => {
    if (!ready || !customer || !pendingProvider) return;
    const service = await firstService();
    if (!service) return;
    const profile = await ensureProviderStatusForTest(
      pendingProvider.userId,
      'pending_verification',
    );
    await ensureTestProviderService(profile.id, service.id);
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec quote pending' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, service.id, { title: '[TEST] sec quote pending' });
    const res = await postJson<{ amountCents: number }, ApiResponse<QuoteRecord>>(app, `/requests/${req.id}/quotes`, pendingProvider.accessToken, { amountCents: 12000 });
    expect(res.statusCode).toBe(403);
  });

  it('6. incompatible provider cannot send quote', async () => {
    if (!ready || !customer || !provider) return;
    const servicesRes = await getJson<ApiResponse<Service[]>>(app, '/services');
    const services = servicesRes.body.data ?? [];
    if (services.length < 2) return;
    const s1 = services[0]!.id;
    const s2 = services[1]!.id;
    const profile = await ensureTestProviderIsActive(provider.userId);
    await ensureTestProviderService(profile.id, s2);
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec quote incompatible' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, s1, { title: '[TEST] sec quote incompatible' });
    const res = await postJson<{ amountCents: number }, ApiResponse<QuoteRecord>>(app, `/requests/${req.id}/quotes`, provider.accessToken, { amountCents: 15000 });
    expect([400, 403]).toContain(res.statusCode);
  });

  it('7. non-contracted provider cannot check-in', async () => {
    if (!ready || !pendingProvider) return;
    const flow = await scheduledFlow();
    if (!flow) return;
    const res = await postJson<{ selfiePath: string }, ApiResponse<RequestRecord>>(app, `/requests/${flow.requestId}/check-in`, pendingProvider.accessToken, { selfiePath: '[TEST]/x.jpg' });
    expect(res.statusCode).toBe(403);
  });

  it('8. non-contracted provider cannot start service', async () => {
    if (!ready || !pendingProvider) return;
    const flow = await scheduledFlow();
    if (!flow) return;
    const res = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(app, `/requests/${flow.requestId}/start`, pendingProvider.accessToken, { pin: flow.pin });
    expect(res.statusCode).toBe(403);
  });

  it('9. provider cannot start with wrong PIN', async () => {
    if (!ready || !provider) return;
    const flow = await scheduledFlow();
    if (!flow) return;
    const res = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(app, `/requests/${flow.requestId}/start`, provider.accessToken, { pin: '999999' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('10. provider cannot start without check-in', async () => {
    if (!ready || !customer || !provider) return;
    const service = await firstService();
    if (!service) return;
    const profile = await ensureTestProviderIsActive(provider.userId);
    await ensureTestProviderService(profile.id, service.id);
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec start no checkin' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, service.id, { title: '[TEST] sec start no checkin' });
    const quote = await postJson<{ amountCents: number }, ApiResponse<QuoteRecord>>(app, `/requests/${req.id}/quotes`, provider.accessToken, { amountCents: 14500 });
    if (![200, 201].includes(quote.statusCode) || !quote.body.data?.id) return;
    await postJson<undefined, ApiResponse<unknown>>(app, `/quotes/${quote.body.data.id}/accept`, customer.accessToken);
    const pinRes = await postJson<undefined, ApiResponse<{ pin?: string }>>(app, `/requests/${req.id}/generate-pin`, customer.accessToken);
    const pin = pinRes.body.data?.pin;
    if (!pin) return;
    const start = await postJson<{ pin: string }, ApiResponse<RequestRecord>>(app, `/requests/${req.id}/start`, provider.accessToken, { pin });
    expect(start.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('11. customer cannot manually change request status', async () => {
    if (!ready || !customer) return;
    const service = await firstService();
    if (!service) return;
    const addr = await createTestAddress(app, customer.accessToken, { label: '[TEST] sec patch status' });
    const req = await createTestRequest(app, customer.accessToken, addr.id, service.id, { title: '[TEST] sec patch status' });
    const patch = await patchJson<Record<string, unknown>, ApiResponse<RequestRecord>>(app, `/requests/${req.id}`, customer.accessToken, { status: 'completed' });
    if (patch.statusCode >= 400) {
      expect(patch.statusCode).toBe(400);
      return;
    }
    const details = await getJson<ApiResponse<RequestRecord>>(app, `/requests/${req.id}`, customer.accessToken);
    expect(details.body.data?.status).toBe('open');
  });

  it('12. common user cannot access admin routes', async () => {
    if (!customer) return;
    const res = await getJson<ApiResponse<unknown>>(app, '/admin/providers/pending', customer.accessToken);
    expect(res.statusCode).toBe(403);
  });

  it('13. common user cannot approve provider', async () => {
    if (!ready || !customer || !pendingProvider) return;
    const profile = await ensureProviderStatusForTest(
      pendingProvider.userId,
      'pending_verification',
    );
    const res = await postJson<{ note: string }, ApiResponse<{ status?: string }>>(
      app,
      `/admin/providers/${profile.id}/approve`,
      customer.accessToken,
      { note: '[TEST] forbidden approve' },
    );
    expect(res.statusCode).toBe(403);
  });

  it('14. common user cannot change financial status (if endpoint exists)', async () => {
    if (!customer) return;
    const probe = await postJson<Record<string, unknown>, ApiResponse<unknown>>(app, '/payments/test/mark-paid', customer.accessToken, { status: 'paid' });
    expect([403, 404]).toContain(probe.statusCode);
  });

  it('15. provider cannot view PIN directly from request data', async () => {
    if (!ready || !provider) return;
    const flow = await scheduledFlow();
    if (!flow) return;

    const view = await getJson<ApiResponse<Record<string, unknown>>>(app, `/requests/${flow.requestId}`, provider.accessToken);
    expect(view.statusCode).toBe(200);

    const requestData = view.body.data ?? {};
    expect('pin' in requestData).toBe(false);
    expect('start_pin' in requestData).toBe(false);
    expect('generated_pin' in requestData).toBe(false);
  });
});
