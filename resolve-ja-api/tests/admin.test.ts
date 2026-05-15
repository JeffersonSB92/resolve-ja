import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import {
  signInAdmin,
  signInCustomer,
  signInPendingProvider,
  signInProvider,
} from './helpers/auth.js';
import { cleanupTestData } from './helpers/cleanup.js';
import {
  ensureProviderStatusForTest,
  getProviderProfileByUserIdForTest,
} from './helpers/seed.js';
import { getJson, postJson } from './helpers/http.js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type ProviderProfile = {
  id: string;
  user_id: string;
  status: string;
  verified_at?: string | null;
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

const hasAdminCredentials = hasRequiredEnv('TEST_ADMIN_EMAIL') && hasRequiredEnv('TEST_ADMIN_PASSWORD');
const hasCustomerCredentials =
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') && hasRequiredEnv('TEST_CUSTOMER_PASSWORD');
const hasProviderCredentials =
  hasRequiredEnv('TEST_PROVIDER_EMAIL') && hasRequiredEnv('TEST_PROVIDER_PASSWORD');
const hasPendingProviderCredentials =
  hasRequiredEnv('TEST_PENDING_PROVIDER_EMAIL') &&
  hasRequiredEnv('TEST_PENDING_PROVIDER_PASSWORD');

describe('Admin endpoints', () => {
  let app: FastifyInstance;
  let adminUser: AuthUser | null = null;
  let customerUser: AuthUser | null = null;
  let providerUser: AuthUser | null = null;
  let pendingProviderUser: AuthUser | null = null;
  let integrationReady = false;

  let providerOriginalStatus: string | null = null;
  let pendingOriginalStatus: string | null = null;

  beforeAll(async () => {
    app = await createTestApp();

    if (
      !hasAdminCredentials ||
      !hasCustomerCredentials ||
      !hasProviderCredentials ||
      !hasPendingProviderCredentials
    ) {
      return;
    }

    try {
      adminUser = await signInAdmin();
      customerUser = await signInCustomer();
      providerUser = await signInProvider();
      pendingProviderUser = await signInPendingProvider();

      const probe = await getJson<ApiResponse<unknown>>(app, '/health');
      integrationReady = probe.statusCode === 200 && process.env.NODE_ENV === 'test';

      if (!integrationReady || !providerUser || !pendingProviderUser) {
        return;
      }

      await cleanupTestData();

      const providerProfile = await getProviderProfileByUserIdForTest(providerUser.userId);
      const pendingProfile = await getProviderProfileByUserIdForTest(
        pendingProviderUser.userId,
      );

      providerOriginalStatus = providerProfile?.status ?? null;
      pendingOriginalStatus = pendingProfile?.status ?? null;

      await ensureProviderStatusForTest(providerUser.userId, 'active');
      await ensureProviderStatusForTest(pendingProviderUser.userId, 'pending_verification');
    } catch {
      integrationReady = false;
    }
  });

  afterAll(async () => {
    if (integrationReady && providerUser && pendingProviderUser) {
      const providerRestoreStatus = providerOriginalStatus ?? 'active';
      const pendingRestoreStatus = pendingOriginalStatus ?? 'pending_verification';

      await ensureProviderStatusForTest(
        providerUser.userId,
        providerRestoreStatus as 'active' | 'pending_verification' | 'rejected' | 'suspended',
      );
      await ensureProviderStatusForTest(
        pendingProviderUser.userId,
        pendingRestoreStatus as 'active' | 'pending_verification' | 'rejected' | 'suspended',
      );

      await cleanupTestData();
    }

    await closeTestApp(app);
  });

  it('1. customer cannot access admin route', async () => {
    if (!customerUser) return;

    const response = await getJson<ApiResponse<ProviderProfile[]>>(
      app,
      '/admin/providers/pending',
      customerUser.accessToken,
    );

    expect(response.statusCode).toBe(403);
  });

  it('2. provider cannot access admin route', async () => {
    if (!providerUser) return;

    const response = await getJson<ApiResponse<ProviderProfile[]>>(
      app,
      '/admin/providers/pending',
      providerUser.accessToken,
    );

    expect(response.statusCode).toBe(403);
  });

  it('3. admin route without token returns 401', async () => {
    const response = await getJson<ApiResponse<ProviderProfile[]>>(app, '/admin/providers/pending');
    expect(response.statusCode).toBe(401);
  });

  it('4. admin lists pending providers', async () => {
    if (!integrationReady || !adminUser) return;

    const response = await getJson<ApiResponse<ProviderProfile[]>>(
      app,
      '/admin/providers/pending',
      adminUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('5. admin approves provider', async () => {
    if (!integrationReady || !adminUser || !pendingProviderUser) return;

    const pending = await ensureProviderStatusForTest(
      pendingProviderUser.userId,
      'pending_verification',
    );

    const response = await postJson<{ note: string }, ApiResponse<ProviderProfile>>(
      app,
      `/admin/providers/${pending.id}/approve`,
      adminUser.accessToken,
      { note: '[TEST] approve provider' },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.status).toBe('active');
  });

  it('6. admin rejects provider', async () => {
    if (!integrationReady || !adminUser || !pendingProviderUser) return;

    const pending = await ensureProviderStatusForTest(
      pendingProviderUser.userId,
      'pending_verification',
    );

    const response = await postJson<{ reason: string }, ApiResponse<ProviderProfile>>(
      app,
      `/admin/providers/${pending.id}/reject`,
      adminUser.accessToken,
      { reason: '[TEST] reject provider' },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.status).toBe('rejected');
  });

  it('7. admin suspends provider', async () => {
    if (!integrationReady || !adminUser || !providerUser) return;

    const active = await ensureProviderStatusForTest(providerUser.userId, 'active');

    const response = await postJson<{ reason: string }, ApiResponse<ProviderProfile>>(
      app,
      `/admin/providers/${active.id}/suspend`,
      adminUser.accessToken,
      { reason: '[TEST] suspend provider' },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.data?.status).toBe('suspended');

    await ensureProviderStatusForTest(providerUser.userId, 'active');
  });

  it('8. admin lists requests', async () => {
    if (!integrationReady || !adminUser) return;

    const response = await getJson<ApiResponse<Record<string, unknown>[]>>(
      app,
      '/admin/requests',
      adminUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('9. admin lists reports', async () => {
    if (!integrationReady || !adminUser) return;

    const response = await getJson<ApiResponse<Record<string, unknown>[]>>(
      app,
      '/admin/reports',
      adminUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
