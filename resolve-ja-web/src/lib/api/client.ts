import { ApiError } from '@/lib/api/api-error';
import { ApiEnvelope, ApiFailureResponse, ApiFetchOptions } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured.');
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiFailureResponse(value: unknown): value is ApiFailureResponse {
  if (!isObject(value)) return false;
  if (value.success !== false) return false;
  if (!isObject(value.error)) return false;

  return typeof value.error.code === 'string' && typeof value.error.message === 'string';
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

export async function apiFetch<T>(
  path: string,
  method: HttpMethod,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, signal, body, headers } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (isApiFailureResponse(payload)) {
      throw new ApiError({
        statusCode: response.status,
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details,
      });
    }

    throw new ApiError({
      statusCode: response.status,
      code: 'HTTP_ERROR',
      message: 'Não foi possível processar sua solicitação.',
    });
  }

  const envelope = payload as ApiEnvelope<T> | null;

  if (!envelope) {
    throw new ApiError({
      statusCode: response.status,
      code: 'INVALID_RESPONSE',
      message: 'A API retornou uma resposta vazia.',
    });
  }

  if (envelope.success === false) {
    throw new ApiError({
      statusCode: response.status,
      code: envelope.error.code,
      message: envelope.error.message,
      details: envelope.error.details,
    });
  }

  return envelope.data;
}

export function getApi<T>(path: string, options?: Omit<ApiFetchOptions, 'body'>): Promise<T> {
  return apiFetch<T>(path, 'GET', options);
}

export function postApi<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiFetchOptions, 'body'>,
): Promise<TResponse> {
  return apiFetch<TResponse>(path, 'POST', { ...options, body });
}

export function patchApi<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiFetchOptions, 'body'>,
): Promise<TResponse> {
  return apiFetch<TResponse>(path, 'PATCH', { ...options, body });
}

export function deleteApi<T>(path: string, options?: Omit<ApiFetchOptions, 'body'>): Promise<T> {
  return apiFetch<T>(path, 'DELETE', options);
}
