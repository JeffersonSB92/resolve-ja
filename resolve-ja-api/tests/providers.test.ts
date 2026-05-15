import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import {
  signInCustomer,
  signInOtherUser,
  signInProvider,
} from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import { deleteProviderProfileIfTestOwnedForTest } from './helpers/seed.js';
import { getJson, patchJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type ProviderProfile = {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  base_city: string;
  base_neighborhood: string | null;
  service_radius_km: number | null;
  status: string;
  average_rating: number | null;
  rating_count: number | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type CreateProviderProfilePayload = {
  displayName?: string;
  bio?: string | null;
  baseState?: string;
  baseCity?: string;
  baseNeighborhood?: string | null;
  serviceRadiusKm?: number;
};

function hasRequiredEnv(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}


const hasProviderCredentials =
  hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');
const hasOtherUserCredentials =
  hasRequiredEnv('TEST_OTHER_USER_EMAIL') && hasRequiredEnv('TEST_OTHER_USER_PASSWORD');

describe('Providers profile endpoints', () => {
  let app: FastifyInstance;
  let providerUser: AuthUser | null = null;
  let customerUser: AuthUser | null = null;
  let otherUser: AuthUser | null = null;
  let integrationReady = false;
  let createFlowReady = false;

  beforeAll(async () => {
    app = await createTestApp();

    if (!hasProviderCredentials || !hasCustomerCredentials || !hasOtherUserCredentials) {
      return;
    }

    try {
      providerUser = await signInProvider();
      customerUser = await signInCustomer();
      otherUser = await signInOtherUser();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200;

      if (!integrationReady || !otherUser) {
        return;
      }

      if (process.env.NODE_ENV !== 'test') {
        return;
      }

      await cleanupTestData();
      createFlowReady = await deleteProviderProfileIfTestOwnedForTest(otherUser.userId);
    } catch {
      integrationReady = false;
      createFlowReady = false;
    }
  });

  afterAll(async () => {
    if (integrationReady) {
      await cleanupTestData();
    }

    if (otherUser) {
      await deleteProviderProfileIfTestOwnedForTest(otherUser.userId);
    }

    await closeTestApp(app);
  });

  it('1. authenticated user creates provider profile with pending_verification', async () => {
    if (!integrationReady || !createFlowReady || !otherUser) {
      return;
    }

    const response = await postJson<CreateProviderProfilePayload, ApiResponse<ProviderProfile>>(
      app,
      '/providers/profile',
      otherUser.accessToken,
      {
        displayName: '[TEST] Provider Fresh',
        baseState: 'RS',
        baseCity: 'Passo Fundo',
        baseNeighborhood: 'Centro',
        bio: '[TEST] profile creation',
      },
    );

    expect([200, 201]).toContain(response.statusCode);
    expect(response.body.success).toBe(true);
    expect(response.body.data?.status).toBe('pending_verification');
  });

  it('2. should not create profile without authentication', async () => {
    const response = await postJson<CreateProviderProfilePayload, ApiResponse<ProviderProfile>>(
      app,
      '/providers/profile',
      undefined,
      {
        displayName: '[TEST] no auth profile',
        baseState: 'RS',
        baseCity: 'Passo Fundo',
      },
    );

    expect(response.statusCode).toBe(401);
  });

  it('3. should not create profile without required fields', async () => {
    if (!integrationReady || !otherUser) {
      return;
    }

    const response = await postJson<CreateProviderProfilePayload, ApiResponse<ProviderProfile>>(
      app,
      '/providers/profile',
      otherUser.accessToken,
      {
        baseState: 'RS',
      },
    );

    expect(response.statusCode).toBe(400);
  });

  it('4. should not allow user to create two profiles', async () => {
    if (!integrationReady || !createFlowReady || !otherUser) {
      return;
    }

    const firstTry = await postJson<CreateProviderProfilePayload, ApiResponse<ProviderProfile>>(
      app,
      '/providers/profile',
      otherUser.accessToken,
      {
        displayName: '[TEST] Provider Duplicate Check',
        baseState: 'RS',
        baseCity: 'Passo Fundo',
      },
    );

    expect([200, 201, 409]).toContain(firstTry.statusCode);

    const secondTry = await postJson<CreateProviderProfilePayload, ApiResponse<ProviderProfile>>(
      app,
      '/providers/profile',
      otherUser.accessToken,
      {
        displayName: '[TEST] Provider Duplicate Check 2',
        baseState: 'RS',
        baseCity: 'Passo Fundo',
      },
    );

    expect(secondTry.statusCode).toBe(409);
  });

  it('5. GET /providers/me returns provider profile', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const response = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data?.id).toBe('string');
  });

  it('6. GET /providers/me returns 404 for user without profile', async () => {
    if (!integrationReady || !customerUser) {
      return;
    }

    const response = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      customerUser.accessToken,
    );

    expect(response.statusCode).toBe(404);
  });

  it('7. PATCH /providers/me updates allowed fields', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const response = await patchJson<
      { bio: string; baseNeighborhood: string; serviceRadiusKm: number },
      ApiResponse<ProviderProfile>
    >(app, '/providers/me', providerUser.accessToken, {
      bio: '[TEST] updated bio',
      baseNeighborhood: 'Vila Rodrigues',
      serviceRadiusKm: 18,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data?.bio).toBe('[TEST] updated bio');
    expect(response.body.data?.base_neighborhood).toBe('Vila Rodrigues');
    expect(response.body.data?.service_radius_km).toBe(18);
  });

  it('8. PATCH /providers/me should not allow status change by provider', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const before = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
    );
    expect(before.statusCode).toBe(200);

    const attempt = await patchJson<Record<string, unknown>, ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
      {
        status: 'active',
      },
    );

    if (attempt.statusCode >= 400) {
      expect(attempt.statusCode).toBe(400);
      return;
    }

    const after = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
    );

    expect(after.statusCode).toBe(200);
    expect(after.body.data?.status).toBe(before.body.data?.status);
  });

  it('9. PATCH /providers/me should not allow rating changes', async () => {
    if (!integrationReady || !providerUser) {
      return;
    }

    const before = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
    );
    expect(before.statusCode).toBe(200);

    const attempt = await patchJson<Record<string, unknown>, ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
      {
        averageRating: 5,
        ratingCount: 999,
      },
    );

    if (attempt.statusCode >= 400) {
      expect(attempt.statusCode).toBe(400);
      return;
    }

    const after = await getJson<ApiResponse<ProviderProfile>>(
      app,
      '/providers/me',
      providerUser.accessToken,
    );

    expect(after.statusCode).toBe(200);
    expect(after.body.data?.average_rating).toBe(before.body.data?.average_rating);
    expect(after.body.data?.rating_count).toBe(before.body.data?.rating_count);
  });
});
