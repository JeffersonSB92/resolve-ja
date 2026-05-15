'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRequestMessage, getRequestMessages } from '@/features/messages/api';
import { CreateMessageInput } from '@/features/messages/types';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function useRequestMessages(requestId?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: requestId ? queryKeys.messages(requestId) : ['messages', 'missing-request'],
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(requestId),
    queryFn: () => {
      if (!accessToken || !requestId) {
        throw new Error('Autenticação e solicitação são obrigatórias.');
      }

      return getRequestMessages(requestId, accessToken);
    },
    select: (messages) =>
      [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
  });
}

export function useCreateRequestMessage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, input }: { requestId: string; input: CreateMessageInput }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return createRequestMessage(requestId, input, accessToken);
    },
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(message.request_id) });
    },
  });
}
