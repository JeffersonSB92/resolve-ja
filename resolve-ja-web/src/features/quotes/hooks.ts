'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptQuote,
  getProviderQuotes,
  getRequestQuotes,
  sendQuote,
  withdrawQuote,
} from '@/features/quotes/api';
import { SendQuoteInput } from '@/features/quotes/types';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function useRequestQuotes(requestId?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: requestId ? queryKeys.quotes.byRequest(requestId) : ['quotes', 'missing-request'],
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(requestId),
    queryFn: () => {
      if (!accessToken || !requestId) {
        throw new Error('Você precisa estar autenticado e informar a solicitação.');
      }

      return getRequestQuotes(requestId, accessToken);
    },
  });
}

export function useProviderQuotes(status?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.quotes.mine(status),
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return getProviderQuotes(accessToken, status);
    },
  });
}

export function useSendQuote() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, input }: { requestId: string; input: SendQuoteInput }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return sendQuote(requestId, input, accessToken);
    },
    onSuccess: async (quote) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.byRequest(quote.request_id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(quote.request_id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine() });
    },
  });
}

export function useWithdrawQuote() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, requestId }: { quoteId: string; requestId: string }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return withdrawQuote(quoteId, accessToken).then((quote) => ({ quote, requestId }));
    },
    onSuccess: async ({ quote, requestId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.byRequest(requestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine(quote.status) });
    },
  });
}

export function useAcceptQuote() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, requestId }: { quoteId: string; requestId: string }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return acceptQuote(quoteId, accessToken).then((payload) => ({ payload, requestId }));
    },
    onSuccess: async ({ requestId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.mine() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.byRequest(requestId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes.mine() });
    },
  });
}
