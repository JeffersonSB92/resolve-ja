export type QuoteStatus = 'sent' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'canceled';

export type Quote = {
  id: string;
  request_id: string;
  provider_id: string;
  amount_cents: number;
  message: string | null;
  estimated_duration_minutes: number | null;
  valid_until: string | null;
  status: QuoteStatus | string;
  created_at: string;
  [key: string]: unknown;
};

export type SendQuoteInput = {
  amountCents: number;
  message?: string;
  estimatedDurationMinutes?: number;
  validUntil?: string;
};

export type AcceptQuoteResponse = {
  serviceRequest: Record<string, unknown>;
  acceptedQuote: Quote;
  payment: Record<string, unknown> | null;
};
