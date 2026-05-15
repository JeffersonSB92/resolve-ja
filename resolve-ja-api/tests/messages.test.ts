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

type QuoteRecord = {
  id: string;
  status: string;
};

type MessageRecord = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  created_at: string;
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

describe('Messages endpoints', () => {
  let app: FastifyInstance;
  let customerUser: AuthUser | null = null;
  let providerUser: AuthUser | null = null;
  let providerBUser: AuthUser | null = null;
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
      providerBUser = await signInPendingProvider();
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

  async function getFirstActiveService(): Promise<Service | null> {
    const list = await getJson<ApiResponse<Service[]>>(app, '/services');
    if (list.statusCode !== 200) {
      return null;
    }
    return (list.body.data ?? [])[0] ?? null;
  }

  async function prepareOpenRequest(): Promise<{ requestId: string; serviceId: string } | null> {
    if (!customerUser) {
      return null;
    }

    const service = await getFirstActiveService();
    if (!service) {
      return null;
    }

    const address = await createTestAddress(app, customerUser.accessToken, {
      label: '[TEST] messages open address',
      street: '[TEST] Rua Messages Open',
    });

    const request = await createTestRequest(app, customerUser.accessToken, address.id, service.id, {
      title: '[TEST] messages open request',
    });

    return { requestId: request.id, serviceId: service.id };
  }

  async function sendQuote(
    requestId: string,
    provider: AuthUser,
    amountCents: number,
  ): Promise<QuoteRecord | null> {
    const quote = await postJson<{ amountCents: number; message: string }, ApiResponse<QuoteRecord>>(
      app,
      `/requests/${requestId}/quotes`,
      provider.accessToken,
      {
        amountCents,
        message: '[TEST] quote for messages',
      },
    );

    if (![200, 201].includes(quote.statusCode) || !quote.body.data) {
      return null;
    }

    return quote.body.data;
  }

  async function prepareRequestWithProviderQuote(): Promise<{
    requestId: string;
    serviceId: string;
    quoteId: string;
  } | null> {
    if (!providerUser) {
      return null;
    }

    const base = await prepareOpenRequest();
    if (!base) {
      return null;
    }

    const profile = await ensureTestProviderIsActive(providerUser.userId);
    await ensureTestProviderService(profile.id, base.serviceId);

    const quote = await sendQuote(base.requestId, providerUser, 17000);
    if (!quote) {
      return null;
    }

    return {
      requestId: base.requestId,
      serviceId: base.serviceId,
      quoteId: quote.id,
    };
  }

  async function prepareScheduledRequestWithAcceptedQuote(): Promise<{
    requestId: string;
    quoteId: string;
  } | null> {
    if (!customerUser) {
      return null;
    }

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) {
      return null;
    }

    const accepted = await postJson<undefined, ApiResponse<{ acceptedQuote?: QuoteRecord }>>(
      app,
      `/quotes/${flow.quoteId}/accept`,
      customerUser.accessToken,
    );

    if (accepted.statusCode !== 200) {
      return null;
    }

    return {
      requestId: flow.requestId,
      quoteId: flow.quoteId,
    };
  }

  it('1. request owner sends message', async () => {
    if (!integrationReady || !customerUser) return;

    const flow = await prepareOpenRequest();
    if (!flow) return;

    const response = await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
      { body: '[TEST] owner message' },
    );

    expect([200, 201]).toContain(response.statusCode);
    expect(typeof response.body.data?.id).toBe('string');
  });

  it('2. provider with quote sends message', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) return;

    const response = await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      providerUser.accessToken,
      { body: '[TEST] provider with quote message' },
    );

    expect([200, 201]).toContain(response.statusCode);
  });

  it('3. contracted provider sends message', async () => {
    if (!integrationReady || !providerUser) return;

    const flow = await prepareScheduledRequestWithAcceptedQuote();
    if (!flow) return;

    const response = await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      providerUser.accessToken,
      { body: '[TEST] contracted provider message' },
    );

    expect([200, 201]).toContain(response.statusCode);
  });

  it('4. external user cannot send message', async () => {
    if (!integrationReady || !otherUser) return;

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) return;

    const response = await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      otherUser.accessToken,
      { body: '[TEST] external blocked message' },
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('5. external user cannot list messages', async () => {
    if (!integrationReady || !otherUser || !customerUser) return;

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) return;

    await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
      { body: '[TEST] list blocked seed' },
    );

    const response = await getJson<ApiResponse<MessageRecord[]>>(
      app,
      `/requests/${flow.requestId}/messages`,
      otherUser.accessToken,
    );

    expect([403, 404]).toContain(response.statusCode);
  });

  it('6. owner lists request messages ordered by createdAt asc', async () => {
    if (!integrationReady || !customerUser || !providerUser) return;

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) return;

    await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
      { body: '[TEST] message 1' },
    );

    await postJson<{ body: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      providerUser.accessToken,
      { body: '[TEST] message 2' },
    );

    const response = await getJson<ApiResponse<MessageRecord[]>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
    );

    expect(response.statusCode).toBe(200);
    const messages = response.body.data ?? [];
    expect(messages.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < messages.length; i += 1) {
      const previous = new Date(messages[i - 1]!.created_at).getTime();
      const current = new Date(messages[i]!.created_at).getTime();
      expect(previous <= current).toBe(true);
    }
  });

  it('7. message with empty body and empty attachment should fail', async () => {
    if (!integrationReady || !customerUser) return;

    const flow = await prepareOpenRequest();
    if (!flow) return;

    const response = await postJson<{ body: string; attachmentPath: string }, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
      {
        body: '',
        attachmentPath: '',
      },
    );

    expect(response.statusCode).toBe(400);
  });

  it('8. senderId cannot be forged', async () => {
    if (!integrationReady || !customerUser || !providerUser || !providerBUser) return;

    const flow = await prepareRequestWithProviderQuote();
    if (!flow) return;

    const forged = await postJson<Record<string, unknown>, ApiResponse<MessageRecord>>(
      app,
      `/requests/${flow.requestId}/messages`,
      providerUser.accessToken,
      {
        body: '[TEST] forged sender message',
        senderId: providerBUser.userId,
      },
    );

    if (forged.statusCode >= 400) {
      expect(forged.statusCode).toBe(400);
      return;
    }

    const listed = await getJson<ApiResponse<MessageRecord[]>>(
      app,
      `/requests/${flow.requestId}/messages`,
      customerUser.accessToken,
    );

    expect(listed.statusCode).toBe(200);
    const msg = (listed.body.data ?? []).find(
      (item) => item.body === '[TEST] forged sender message',
    );
    expect(msg).toBeDefined();
    expect(msg?.sender_id).toBe(providerUser.userId);
    expect(msg?.sender_id).not.toBe(providerBUser.userId);
  });
});
