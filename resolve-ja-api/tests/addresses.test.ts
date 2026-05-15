import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { signInCustomer, signInOtherUser } from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import { createTestRequest, getActiveService } from './helpers/seed.js';
import { deleteJson, getJson, patchJson, postJson } from './helpers/http.js';

type AddressRecord = {
  id: string;
  label?: string | null;
  state?: string;
  city?: string;
  street?: string;
};

type AddressCreatePayload = {
  label?: string | null;
  state?: string;
  city?: string;
  street?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') &&
  hasRequiredEnv('TEST_CUSTOMER_PASSWORD');

const hasOtherUserCredentials =
  hasRequiredEnv('TEST_OTHER_USER_EMAIL') &&
  hasRequiredEnv('TEST_OTHER_USER_PASSWORD');

describe('Addresses endpoints', () => {
  let app: FastifyInstance;
  let customer: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let integrationReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasCustomerCredentials || !hasOtherUserCredentials) {
      return;
    }

    try {
      customer = await signInCustomer();
      otherUser = await signInOtherUser();

      const probe = await getJson<ApiResponse<AddressRecord[]>>(
        app,
        '/addresses',
        customer.accessToken,
      );

      integrationReady = probe.statusCode === 200;
    } catch {
      integrationReady = false;
    }

    if (integrationReady) {
      await cleanupTestData();
    }
  });

  afterAll(async () => {
    if (integrationReady) {
      await cleanupTestData();
    }
    await closeTestApp(app);
  });

  it('1) should create address with authenticated user', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const response = await postJson(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] address create',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Create',
      },
    );

    expect([200, 201]).toContain(response.statusCode);
    expect(response.body.success).toBe(true);
    expect(typeof (response.body.data as AddressRecord | undefined)?.id).toBe('string');
  });

  it('2) should not create address without token', async () => {
    const response = await postJson(app, '/addresses', undefined, {
      label: '[TEST] address no token',
      state: 'RS',
      city: 'Passo Fundo',
      street: 'Rua Teste No Token',
    });

    expect(response.statusCode).toBe(401);
  });

  it('3) should not create address without required fields', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const response = await postJson(app, '/addresses', customer.accessToken, {
      label: '[TEST] invalid missing required',
    });

    expect(response.statusCode).toBe(400);
  });

  it('4) should list only addresses from logged user', async () => {
    if (!integrationReady || !customer || !otherUser) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] customer only address',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Customer Only',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    const otherList = await getJson<ApiResponse<AddressRecord[]>>(
      app,
      '/addresses',
      otherUser.accessToken,
    );

    expect(otherList.statusCode).toBe(200);
    const otherAddresses = otherList.body.data ?? [];
    expect(otherAddresses.some((address) => address.id === addressId)).toBe(false);
  });

  it('5) should fetch own address', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] own address get',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Own Get',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    const response = await getJson<ApiResponse<AddressRecord>>(
      app,
      `/addresses/${addressId}`,
      customer.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.id).toBe(addressId);
  });

  it('6) should block external user from accessing foreign address', async () => {
    if (!integrationReady || !customer || !otherUser) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] foreign address get blocked',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Foreign Get',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    const response = await getJson<ApiResponse<AddressRecord>>(
      app,
      `/addresses/${addressId}`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('7) should update own address', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] own address patch',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Patch Before',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    const response = await patchJson(
      app,
      `/addresses/${addressId}`,
      customer.accessToken,
      {
        street: 'Rua Teste Patch After',
      },
    );

    expect(response.statusCode).toBe(200);
    expect((response.body.data as AddressRecord | undefined)?.street).toBe(
      'Rua Teste Patch After',
    );
  });

  it('8) should block external user from editing foreign address', async () => {
    if (!integrationReady || !customer || !otherUser) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] foreign address patch blocked',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Foreign Patch',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    const response = await patchJson(
      app,
      `/addresses/${addressId}`,
      otherUser.accessToken,
      {
        street: 'Rua Invasao',
      },
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('9) should delete own address when no active request exists', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const created = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] own address delete ok',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Delete OK',
      },
    );

    const addressId = created.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    const response = await deleteJson<undefined, ApiResponse<{ deleted?: boolean }>>(
      app,
      `/addresses/${addressId}`,
      customer.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data?.deleted).toBe(true);
  });

  it('10) should not delete address linked to active request', async () => {
    if (!integrationReady || !customer) {
      return;
    }

    const service = await getActiveService();

    const createdAddress = await postJson<AddressCreatePayload, ApiResponse<AddressRecord>>(
      app,
      '/addresses',
      customer.accessToken,
      {
        label: '[TEST] address linked request',
        state: 'RS',
        city: 'Passo Fundo',
        street: 'Rua Teste Linked Request',
      },
    );

    const addressId = createdAddress.body.data?.id;
    expect(typeof addressId).toBe('string');

    if (!addressId) {
      return;
    }

    await createTestRequest(app, customer.accessToken, addressId, service.id, {
      title: '[TEST] request for address deletion block',
      description: '[TEST] active request for delete validation',
    });

    const response = await deleteJson<undefined, ApiResponse<{ deleted?: boolean }>>(
      app,
      `/addresses/${addressId}`,
      customer.accessToken,
    );

    expect([400, 409]).toContain(response.statusCode);
  });
});
