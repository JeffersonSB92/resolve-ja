import type { FastifyInstance, HTTPMethods, LightMyRequestResponse } from 'fastify';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type InjectJsonParams<TPayload> = {
  method: HTTPMethods;
  url: string;
  token?: string;
  payload?: TPayload;
};

type InjectJsonResult<TResponse> = {
  statusCode: number;
  body: TResponse;
  raw: LightMyRequestResponse;
};

function tryParseJson(text: string): unknown {
  if (text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function injectJson<TPayload = unknown, TResponse = unknown>(
  app: FastifyInstance,
  { method, url, token, payload }: InjectJsonParams<TPayload>,
): Promise<InjectJsonResult<TResponse>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await app.inject({
    method,
    url,
    headers,
    payload: payload as JsonValue | undefined,
  });

  const parsedBody = tryParseJson(response.body) as TResponse;

  return {
    statusCode: response.statusCode,
    body: parsedBody,
    raw: response,
  };
}

export async function getJson<TResponse = unknown>(
  app: FastifyInstance,
  url: string,
  token?: string,
): Promise<InjectJsonResult<TResponse>> {
  return injectJson<undefined, TResponse>(app, {
    method: 'GET',
    url,
    token,
  });
}

export async function postJson<TPayload = unknown, TResponse = unknown>(
  app: FastifyInstance,
  url: string,
  token?: string,
  payload?: TPayload,
): Promise<InjectJsonResult<TResponse>> {
  return injectJson<TPayload, TResponse>(app, {
    method: 'POST',
    url,
    token,
    payload,
  });
}

export async function patchJson<TPayload = unknown, TResponse = unknown>(
  app: FastifyInstance,
  url: string,
  token?: string,
  payload?: TPayload,
): Promise<InjectJsonResult<TResponse>> {
  return injectJson<TPayload, TResponse>(app, {
    method: 'PATCH',
    url,
    token,
    payload,
  });
}

export async function deleteJson<TPayload = unknown, TResponse = unknown>(
  app: FastifyInstance,
  url: string,
  token?: string,
  payload?: TPayload,
): Promise<InjectJsonResult<TResponse>> {
  return injectJson<TPayload, TResponse>(app, {
    method: 'DELETE',
    url,
    token,
    payload,
  });
}
