import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { signInCustomer, signInProvider } from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import { getActiveService } from './helpers/seed.js';
import { deleteJson, getJson, patchJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type Service = {
  id: string;
  active?: boolean;
};

type ProviderService = {
  id: string;
  provider_id: string;
  service_id: string;
  base_price_cents: number | null;
  price_notes: string | null;
  active: boolean;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type ProviderServicePayload = {
  serviceId: string;
  basePriceCents?: number | null;
  priceNotes?: string | null;
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

const hasProviderCredentials =
  hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');

describe('Provider services endpoints', () => {
  let app: FastifyInstance;
  let providerUser: AuthUser | null = null;
  let customerUser: AuthUser | null = null;
  let integrationReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasProviderCredentials || !hasCustomerCredentials) {
      return;
    }

    try {
      providerUser = await signInProvider();
      customerUser = await signInCustomer();

      const probe = await getJson<ApiResponse<unknown>>(app, '/providers/me', providerUser.accessToken);
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

  async function resolveActiveServiceIdForProvider(): Promise<string | null> {
    if (!providerUser) {
      return null;
    }

    const catalog = await getJson<ApiResponse<Service[]>>(app, '/services');
    if (catalog.statusCode !== 200 || !catalog.body.data || catalog.body.data.length === 0) {
      return null;
    }

    const linked = await getJson<ApiResponse<ProviderService[]>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
    );

    if (linked.statusCode !== 200) {
      return null;
    }

    const linkedServiceIds = new Set((linked.body.data ?? []).map((row) => row.service_id));
    const available = (catalog.body.data ?? []).find((service) => !linkedServiceIds.has(service.id));

    return available?.id ?? null;
  }

  it('1. provider adds active service', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const serviceId = (await resolveActiveServiceIdForProvider()) ?? (await getActiveService()).id;

    const response = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: 12500,
        priceNotes: '[TEST] service add',
      },
    );

    expect([200, 201, 409]).toContain(response.statusCode);
  });

  it('2. customer without provider profile cannot add service', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const activeService = await getActiveService();
    const response = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      customerUser.accessToken,
      {
        serviceId: activeService.id,
        basePriceCents: 10000,
        priceNotes: '[TEST] customer should fail',
      },
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('3. should not add non-existing service', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const response = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId: '11111111-1111-1111-1111-111111111111',
        basePriceCents: 10000,
        priceNotes: '[TEST] missing service',
      },
    );

    expect(response.statusCode).toBe(404);
  });

  it('4. should not add duplicated service', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const serviceId = (await resolveActiveServiceIdForProvider()) ?? (await getActiveService()).id;

    const first = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: 15000,
        priceNotes: '[TEST] duplicate step one',
      },
    );

    expect([200, 201, 409]).toContain(first.statusCode);

    const second = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: 15000,
        priceNotes: '[TEST] duplicate step two',
      },
    );

    expect(second.statusCode).toBe(409);
  });

  it('5. should list provider services', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const list = await getJson<ApiResponse<ProviderService[]>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
    );

    expect(list.statusCode).toBe(200);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.data)).toBe(true);
  });

  it('6. provider updates own service price and notes', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const serviceId = (await resolveActiveServiceIdForProvider()) ?? (await getActiveService()).id;

    await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: 9000,
        priceNotes: '[TEST] patch before',
      },
    );

    const patch = await patchJson<
      { basePriceCents: number; priceNotes: string },
      ApiResponse<ProviderService>
    >(app, `/providers/me/services/${serviceId}`, providerUser.accessToken, {
      basePriceCents: 21000,
      priceNotes: '[TEST] patch after',
    });

    expect(patch.statusCode).toBe(200);
    expect(patch.body.success).toBe(true);
    expect(patch.body.data?.base_price_cents).toBe(21000);
    expect(patch.body.data?.price_notes).toBe('[TEST] patch after');
  });

  it('7. should reject negative price', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const serviceId = (await resolveActiveServiceIdForProvider()) ?? (await getActiveService()).id;

    const postAttempt = await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: -1,
        priceNotes: '[TEST] negative post',
      },
    );

    if (postAttempt.statusCode === 409) {
      const patchAttempt = await patchJson<{ basePriceCents: number }, ApiResponse<ProviderService>>(
        app,
        `/providers/me/services/${serviceId}`,
        providerUser.accessToken,
        {
          basePriceCents: -10,
        },
      );
      expect(patchAttempt.statusCode).toBe(400);
      return;
    }

    expect(postAttempt.statusCode).toBe(400);
  });

  it('8. provider removes service', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const serviceId = (await resolveActiveServiceIdForProvider()) ?? (await getActiveService()).id;

    await postJson<ProviderServicePayload, ApiResponse<ProviderService>>(
      app,
      '/providers/me/services',
      providerUser.accessToken,
      {
        serviceId,
        basePriceCents: 9900,
        priceNotes: '[TEST] delete service',
      },
    );

    const deleted = await deleteJson<undefined, ApiResponse<{ deleted?: boolean }>>(
      app,
      `/providers/me/services/${serviceId}`,
      providerUser.accessToken,
    );

    expect(deleted.statusCode).toBe(200);
    expect(deleted.body.success).toBe(true);
    expect(deleted.body.data?.deleted).toBe(true);
  });
});
