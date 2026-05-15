import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { signInAdmin, signInCustomer } from './helpers/auth.js';
import { getJson } from './helpers/http.js';

type MeResponse = {
  success?: boolean;
  data?: {
    userId?: string;
    email?: string | null;
    profile?: unknown;
    roles?: unknown;
    isAdmin?: boolean;
    providerProfile?: unknown;
  };
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
  hasRequiredEnv('TEST_CUSTOMER_EMAIL') &&
  hasRequiredEnv('TEST_CUSTOMER_PASSWORD');

const hasAdminCredentials =
  hasRequiredEnv('TEST_ADMIN_EMAIL') && hasRequiredEnv('TEST_ADMIN_PASSWORD');

describe('Auth module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /me without token should return 401', async () => {
    const response = await getJson<MeResponse>(app, '/me');
    expect(response.statusCode).toBe(401);
  });

  it('GET /me with invalid token should return 401', async () => {
    const response = await getJson<MeResponse>(app, '/me', 'invalid-token');
    expect(response.statusCode).toBe(401);
  });

  it.skipIf(!hasCustomerCredentials)(
    'GET /me with valid customer token should return 200 and required fields',
    async () => {
      const customer = await signInCustomer();
      const response = await getJson<MeResponse>(app, '/me', customer.accessToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.userId).toBeTypeOf('string');
      expect(
        response.body.data?.email === null ||
          typeof response.body.data?.email === 'string',
      ).toBe(true);
      expect(response.body.data?.profile !== undefined).toBe(true);
      expect(Array.isArray(response.body.data?.roles)).toBe(true);
      expect(typeof response.body.data?.isAdmin).toBe('boolean');
      expect(response.body.data?.providerProfile !== undefined).toBe(true);
    },
  );

  it.skipIf(!hasAdminCredentials)(
    'GET /me with admin token should return isAdmin true',
    async () => {
      const admin = await signInAdmin();
      const response = await getJson<MeResponse>(app, '/me', admin.accessToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.isAdmin).toBe(true);
    },
  );
});
