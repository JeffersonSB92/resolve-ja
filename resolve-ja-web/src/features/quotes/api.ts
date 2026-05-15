import { getApi, postApi } from '@/lib/api/client';
import { AcceptQuoteResponse, Quote, SendQuoteInput } from '@/features/quotes/types';

export function sendQuote(requestId: string, input: SendQuoteInput, token: string): Promise<Quote> {
  return postApi<Quote, SendQuoteInput>(`/requests/${requestId}/quotes`, input, { token });
}

export function getRequestQuotes(requestId: string, token: string): Promise<Quote[]> {
  return getApi<Quote[]>(`/requests/${requestId}/quotes`, { token });
}

export function getProviderQuotes(token: string, status?: string): Promise<Quote[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return getApi<Quote[]>(`/providers/me/quotes${query}`, { token });
}

export function withdrawQuote(quoteId: string, token: string): Promise<Quote> {
  return postApi<Quote, Record<string, never>>(`/quotes/${quoteId}/withdraw`, {}, { token });
}

export function acceptQuote(quoteId: string, token: string): Promise<AcceptQuoteResponse> {
  return postApi<AcceptQuoteResponse, Record<string, never>>(`/quotes/${quoteId}/accept`, {}, { token });
}
