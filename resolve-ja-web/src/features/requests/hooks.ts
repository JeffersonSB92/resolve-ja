'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelRequest,
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
} from '@/features/requests/api';
import {
  CancelRequestInput,
  CreateRequestInput,
  UpdateRequestInput,
} from '@/features/requests/types';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function useMyRequests(status?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.requests.mine(status),
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return getMyRequests(accessToken, status);
    },
  });
}

export function useRequest(requestId?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: requestId ? queryKeys.requests.detail(requestId) : ['requests', 'missing-id'],
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(requestId),
    queryFn: () => {
      if (!accessToken || !requestId) {
        throw new Error('Request id e autenticação são obrigatórios.');
      }

      return getRequestById(requestId, accessToken);
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (input: CreateRequestInput) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return createRequest(input, accessToken);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRequestInput }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return updateRequest(id, input, accessToken);
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(updated.id) });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelRequestInput }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return cancelRequest(id, input, accessToken);
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['requests', 'mine'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(updated.id) });
    },
  });
}
