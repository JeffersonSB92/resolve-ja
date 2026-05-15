'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveProvider,
  getAdminReports,
  getAdminRequests,
  getPendingProviders,
  rejectProvider,
  suspendProvider,
} from '@/features/admin/api';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function usePendingProviders() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.admin.pendingProviders,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return getPendingProviders(accessToken);
    },
  });
}

export function useAdminRequests(status?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.admin.requests, status ?? 'all'] as const,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return getAdminRequests(accessToken, status);
    },
  });
}

export function useAdminReports(status?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.admin.reports, status ?? 'all'] as const,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return getAdminReports(accessToken, status);
    },
  });
}

async function invalidateAdminCaches(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingProviders }),
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.requests }),
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports }),
  ]);
}

export function useApproveProvider() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return approveProvider(id, accessToken, note);
    },
    onSuccess: async () => {
      await invalidateAdminCaches(queryClient);
    },
  });
}

export function useRejectProvider() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return rejectProvider(id, accessToken, reason);
    },
    onSuccess: async () => {
      await invalidateAdminCaches(queryClient);
    },
  });
}

export function useSuspendProvider() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return suspendProvider(id, accessToken, reason);
    },
    onSuccess: async () => {
      await invalidateAdminCaches(queryClient);
    },
  });
}
