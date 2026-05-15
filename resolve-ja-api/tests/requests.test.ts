import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { signInCustomer, signInOtherUser } from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import { createTestAddress, getActiveService } from './helpers/seed.js';
import { getJson, patchJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type RequestRecord = {
  id: string;
  requester_id: string;
  service_id: string;
  address_id: string;
  title: string;
  description: string | null;
  status: string;
  budget_cents: number | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type CreateRequestPayload = {
  serviceId: string;
  addressId: string;
  title: string;
  description?: string | null;
  desiredStartAt?: string;
  desiredEndAt?: string;
  budgetCents?: number;
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');
const hasOtherUserCredentials =
  hasRequiredEnv('TEST_OTHER_USER_EMAIL') && hasRequiredEnv('TEST_OTHER_USER_PASSWORD');

describe('Requests endpoints', () => {
  let app: FastifyInstance;
  let customerUser: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let integrationReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasCustomerCredentials || !hasOtherUserCredentials) {
      return;
    }

    try {
      customerUser = await signInCustomer();
      otherUser = await signInOtherUser();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200;

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

  it('1. customer creates request with open status', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request create address',
      street: '[TEST] Rua Request Create',
    });

    const service = await getActiveService();

    const response = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request create',
        description: '[TEST] request description',
        budgetCents: 20000,
      },
    );

    expect([200, 201]).toContain(response.statusCode);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data?.id).toBe('string');
    expect(response.body.data?.status).toBe('open');
  });

  it('2. should not create request without token', async () => {
    const response = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      undefined,
      {
        serviceId: '11111111-1111-1111-1111-111111111111',
        addressId: '11111111-1111-1111-1111-111111111111',
        title: '[TEST] no token request',
      },
    );

    expect(response.statusCode).toBe(401);
  });

  it('3. should not create request with another user address', async () => {
    if (!integrationReady || !customerUser || !otherUser) {
      return;
    }

    const service = await getActiveService();
    const customerAddress = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] address ownership check',
      street: '[TEST] Rua Ownership',
    });

    const response = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      otherUser.accessToken,
      {
        serviceId: service.id,
        addressId: customerAddress.id,
        title: '[TEST] other user request',
      },
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('4. should not create request with non-existing service', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request missing service address',
      street: '[TEST] Rua Missing Service',
    });

    const response = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: '11111111-1111-1111-1111-111111111111',
        addressId: address.id,
        title: '[TEST] request missing service',
      },
    );

    expect(response.statusCode).toBe(404);
  });

  it('5. should not create request when desiredEndAt is before desiredStartAt', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request invalid datetime address',
      street: '[TEST] Rua Invalid Datetime',
    });

    const service = await getActiveService();

    const response = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request invalid date range',
        desiredStartAt: '2026-12-10T10:00:00.000Z',
        desiredEndAt: '2026-12-10T09:00:00.000Z',
      },
    );

    expect(response.statusCode).toBe(400);
  });

  it('6. GET /requests/my should list only owner requests', async () => {
    if (!integrationReady || !customerUser || !otherUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request list owner address',
      street: '[TEST] Rua List Owner',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request list owner',
      },
    );

    expect([200, 201]).toContain(created.statusCode);
    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    const otherList = await getJson<ApiResponse<RequestRecord[]>>(
      app,
      '/requests/my',
      otherUser.accessToken,
    );

    expect(otherList.statusCode).toBe(200);
    const requests = otherList.body.data ?? [];
    expect(requests.some((request) => request.id === requestId)).toBe(false);
  });

  it('7. owner should access own request details', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request details owner address',
      street: '[TEST] Rua Details Owner',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request details owner',
      },
    );

    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    if (!requestId) {
      return;
    }

    const details = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      customerUser.accessToken,
    );

    expect(details.statusCode).toBe(200);
    expect(details.body.data?.id).toBe(requestId);
  });

  it('8. external user should not access foreign request details', async () => {
    if (!integrationReady || !customerUser || !otherUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request details blocked address',
      street: '[TEST] Rua Details Blocked',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request details blocked',
      },
    );

    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    if (!requestId) {
      return;
    }

    const details = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(details.statusCode);
  });

  it('9. owner updates open request', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request patch owner address',
      street: '[TEST] Rua Patch Owner',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request patch owner',
        description: '[TEST] patch before',
        budgetCents: 25000,
      },
    );

    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    if (!requestId) {
      return;
    }

    const patched = await patchJson<
      { title: string; description: string; budgetCents: number },
      ApiResponse<RequestRecord>
    >(app, `/requests/${requestId}`, customerUser.accessToken, {
      title: '[TEST] request patch owner updated',
      description: '[TEST] patch after',
      budgetCents: 32000,
    });

    expect(patched.statusCode).toBe(200);
    expect(patched.body.data?.title).toBe('[TEST] request patch owner updated');
    expect(patched.body.data?.description).toBe('[TEST] patch after');
    expect(patched.body.data?.budget_cents).toBe(32000);
  });

  it('10. owner should not manually change request status via PATCH', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request patch status address',
      street: '[TEST] Rua Patch Status',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request patch status',
      },
    );

    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    if (!requestId) {
      return;
    }

    const patchAttempt = await patchJson<Record<string, unknown>, ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      customerUser.accessToken,
      {
        status: 'completed',
      },
    );

    if (patchAttempt.statusCode >= 400) {
      expect(patchAttempt.statusCode).toBe(400);
      return;
    }

    const after = await getJson<ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}`,
      customerUser.accessToken,
    );

    expect(after.statusCode).toBe(200);
    expect(after.body.data?.status).toBe('open');
  });

  it('11. owner cancels open request', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] request cancel owner address',
      street: '[TEST] Rua Cancel Owner',
    });

    const service = await getActiveService();

    const created = await postJson<CreateRequestPayload, ApiResponse<RequestRecord>>(
      app,
      '/requests',
      customerUser.accessToken,
      {
        serviceId: service.id,
        addressId: address.id,
        title: '[TEST] request cancel owner',
      },
    );

    const requestId = created.body.data?.id;
    expect(typeof requestId).toBe('string');

    if (!requestId) {
      return;
    }

    const canceled = await postJson<{ reason: string }, ApiResponse<RequestRecord>>(
      app,
      `/requests/${requestId}/cancel`,
      customerUser.accessToken,
      {
        reason: '[TEST] cancel by owner',
      },
    );

    expect(canceled.statusCode).toBe(200);
    expect(canceled.body.success).toBe(true);
    expect(canceled.body.data?.status).toBe('canceled');
  });
});
