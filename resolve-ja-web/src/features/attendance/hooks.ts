'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkInRequest,
  confirmServiceCompletion,
  generatePin,
  markServiceDone,
  startRequest,
} from '@/features/attendance/api';
import { useAuth } from '@/features/auth/hooks';
import { CheckInInput, StartRequestInput } from '@/features/attendance/types';
import { queryKeys } from '@/lib/query/keys';

async function invalidateRequestCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  requestId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) }),
    queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.quotes.byRequest(requestId) }),
  ]);
}

export function useCheckInRequest() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, input }: { requestId: string; input: CheckInInput }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return checkInRequest(requestId, input, accessToken);
    },
    onSuccess: async (request) => {
      await invalidateRequestCaches(queryClient, request.id);
    },
  });
}

export function useGeneratePin() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return generatePin(requestId, accessToken).then((pin) => ({ pin, requestId }));
    },
    onSuccess: async ({ requestId }) => {
      await invalidateRequestCaches(queryClient, requestId);
    },
  });
}

export function useStartRequest() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, input }: { requestId: string; input: StartRequestInput }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return startRequest(requestId, input, accessToken);
    },
    onSuccess: async (request) => {
      await invalidateRequestCaches(queryClient, request.id);
    },
  });
}

export function useMarkServiceDone() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return markServiceDone(requestId, accessToken);
    },
    onSuccess: async (request) => {
      await invalidateRequestCaches(queryClient, request.id);
    },
  });
}

export function useConfirmServiceCompletion() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return confirmServiceCompletion(requestId, accessToken);
    },
    onSuccess: async (request) => {
      await invalidateRequestCaches(queryClient, request.id);
    },
  });
}
