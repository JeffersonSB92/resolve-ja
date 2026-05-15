import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import {
  signInCustomer,
  signInPendingProvider,
  signInProvider,
} from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import {
  createTestAddress,
  createTestRequest,
  ensureProviderStatusForTest,
  setProviderServiceActiveStateForTest,
  ensureTestProviderIsActive,
  ensureTestProviderService,
} from './helpers/seed.js';
import { getJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type Service = {
  id: string;
};

type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  service: {
    id: string;
    name: string | null;
    description: string | null;
  };
  locationState: string | null;
  locationCity: string | null;
  locationNeighborhood: string | null;
  desiredStartAt: string | null;
  desiredEndAt: string | null;
  budgetCents: number | null;
  createdAt: string;
  addressId?: unknown;
  street?: unknown;
  number?: unknown;
  complement?: unknown;
  requesterId?: unknown;
  requester?: unknown;
  customer?: unknown;
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


const hasProviderCredentials =
  hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasPendingProviderCredentials =
  hasRequiredEnv('TEST_PENDING_PROVIDER_EMAIL') &&
  hasRequiredEnv('TEST_PENDING_PROVIDER_PASSWORD');
const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');

describe('Provider opportunities endpoint', () => {
  let app: FastifyInstance;
  let providerUser: AuthUser | null = null;
  let pendingProviderUser: AuthUser | null = null;
  let customerUser: AuthUser | null = null;
  let integrationReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasProviderCredentials || !hasPendingProviderCredentials || !hasCustomerCredentials) {
      return;
    }

    try {
      providerUser = await signInProvider();
      pendingProviderUser = await signInPendingProvider();
      customerUser = await signInCustomer();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200 && process.env.NODE_ENV === 'test';

      if (integrationReady && pendingProviderUser) {
        await cleanupTestData();
        await ensureProviderStatusForTest(pendingProviderUser.userId, 'pending_verification');
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

  async function getTwoActiveServices(): Promise<{ first: Service; second: Service } | null> {
    const response = await getJson<ApiResponse<Service[]>>(app, '/services');

    if (response.statusCode !== 200 || !response.body.data || response.body.data.length < 2) {
      return null;
    }

    return {
      first: response.body.data[0] as Service,
      second: response.body.data[1] as Service,
    };
  }

  it('1. active compatible provider sees open request', async () => {
    if (!integrationReady || !providerUser || !customerUser) {
      return;
    }

    const services = await getTwoActiveServices();
    if (!services) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, services.first.id);

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] opportunity compatible address',
      street: '[TEST] Rua Opportunity Compatible',
    });

    const createdRequest = await createTestRequest(
      app,
      customerUser.accessToken,
      address.id,
      services.first.id,
      {
        title: '[TEST] opportunity compatible request',
      },
    );

    const opportunities = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      providerUser.accessToken,
    );

    expect(opportunities.statusCode).toBe(200);
    const items = opportunities.body.data ?? [];
    expect(items.some((item) => item.id === createdRequest.id)).toBe(true);
  });

  it('2. active incompatible provider does not see request', async () => {
    if (!integrationReady || !providerUser || !customerUser) {
      return;
    }

    const services = await getTwoActiveServices();
    if (!services) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, services.first.id);
    await ensureTestProviderService(providerProfile.id, services.second.id);
    await setProviderServiceActiveStateForTest(providerProfile.id, services.first.id, false);
    await setProviderServiceActiveStateForTest(providerProfile.id, services.second.id, true);

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] opportunity incompatible address',
      street: '[TEST] Rua Opportunity Incompatible',
    });

    const createdRequest = await createTestRequest(
      app,
      customerUser.accessToken,
      address.id,
      services.first.id,
      {
        title: '[TEST] opportunity incompatible request',
      },
    );

    const opportunities = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      providerUser.accessToken,
    );

    expect(opportunities.statusCode).toBe(200);
    const items = opportunities.body.data ?? [];
    expect(items.some((item) => item.id === createdRequest.id)).toBe(false);
  });

  it('3. pending provider does not see opportunities', async () => {
    if (!integrationReady || !pendingProviderUser) {
      return;
    }

    const opportunities = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      pendingProviderUser.accessToken,
    );

    expect([200, 403]).toContain(opportunities.statusCode);
    if (opportunities.statusCode === 200) {
      expect((opportunities.body.data ?? []).length).toBe(0);
    }
  });

  it('4. user without provider profile cannot access opportunities', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const response = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      customerUser.accessToken,
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('5. opportunities should not expose full customer address or personal data', async () => {
    if (!integrationReady || !providerUser || !customerUser) {
      return;
    }

    const services = await getTwoActiveServices();
    if (!services) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, services.first.id);

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] opportunity privacy address',
      street: '[TEST] Rua Opportunity Privacy',
    });

    await createTestRequest(app, customerUser.accessToken, address.id, services.first.id, {
      title: '[TEST] opportunity privacy request',
    });

    const opportunities = await getJson<ApiResponse<Opportunity[]>>(
      app,
      '/providers/available-requests',
      providerUser.accessToken,
    );

    expect(opportunities.statusCode).toBe(200);

    const candidate = (opportunities.body.data ?? []).find(
      (item) => item.title === '[TEST] opportunity privacy request',
    );

    expect(candidate).toBeDefined();
    expect(candidate?.addressId).toBeUndefined();
    expect(candidate?.street).toBeUndefined();
    expect(candidate?.number).toBeUndefined();
    expect(candidate?.complement).toBeUndefined();
    expect(candidate?.requesterId).toBeUndefined();
    expect(candidate?.requester).toBeUndefined();
    expect(candidate?.customer).toBeUndefined();
  });

  it('6. serviceId filter returns only matching opportunities', async () => {
    if (!integrationReady || !providerUser || !customerUser) {
      return;
    }

    const services = await getTwoActiveServices();
    if (!services) {
      return;
    }

    const providerProfile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(providerProfile.id, services.first.id);
    await ensureTestProviderService(providerProfile.id, services.second.id);
    await setProviderServiceActiveStateForTest(providerProfile.id, services.first.id, true);
    await setProviderServiceActiveStateForTest(providerProfile.id, services.second.id, true);

    const addressA = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] opportunity filter address A',
      street: '[TEST] Rua Opportunity Filter A',
    });

    const addressB = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] opportunity filter address B',
      street: '[TEST] Rua Opportunity Filter B',
    });

    await createTestRequest(app, customerUser.accessToken, addressA.id, services.first.id, {
      title: '[TEST] opportunity filter request A',
    });

    await createTestRequest(app, customerUser.accessToken, addressB.id, services.second.id, {
      title: '[TEST] opportunity filter request B',
    });

    const filtered = await getJson<ApiResponse<Opportunity[]>>(
      app,
      `/providers/available-requests?serviceId=${services.first.id}`,
      providerUser.accessToken,
    );

    expect(filtered.statusCode).toBe(200);
    const items = filtered.body.data ?? [];
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.service.id === services.first.id)).toBe(true);
  });
});
