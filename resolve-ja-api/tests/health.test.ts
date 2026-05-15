import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { closeTestApp, createTestApp } from './helpers/app.js';
import { getJson } from './helpers/http.js';

type HealthResponse = {
  success?: boolean;
  data?: {
    status?: string;
  };
};

describe('Health endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /health should return 200', async () => {
    const response = await getJson<HealthResponse>(app, '/health');
    expect(response.statusCode).toBe(200);
  });

  it('GET /health should return valid JSON', async () => {
    const response = await getJson<HealthResponse>(app, '/health');
    expect(typeof response.body).toBe('object');
    expect(response.body).not.toBeNull();
  });

  it('GET /health should indicate API is online', async () => {
    const response = await getJson<HealthResponse>(app, '/health');
    expect(response.body.success).toBe(true);
    expect(response.body.data?.status).toBe('ok');
  });
});
