'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/api-error';
import {
  createProviderProfile,
  createProviderServiceMe,
  deleteProviderServiceMe,
  getAvailableRequests,
  getProviderProfileMe,
  getProviderServicesMe,
  updateProviderProfileMe,
  updateProviderServiceMe,
} from '@/features/providers/api';
import {
  AvailableRequestsFilters,
  CreateProviderProfileInput,
  CreateProviderServiceInput,
  UpdateProviderProfileInput,
  UpdateProviderServiceInput,
} from '@/features/providers/types';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function useProviderProfileMe() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.providers.me,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      try {
        return await getProviderProfileMe(accessToken);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
  });
}

export function useCreateProviderProfile() {
  const { accessToken, refreshMe } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProviderProfileInput) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return createProviderProfile(input, accessToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.providers.me }),
        refreshMe(),
      ]);
    },
  });
}

export function useUpdateProviderProfileMe() {
  const { accessToken, refreshMe } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProviderProfileInput) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return updateProviderProfileMe(input, accessToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.providers.me }),
        refreshMe(),
      ]);
    },
  });
}

export function useProviderServicesMe() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.providers.services,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return getProviderServicesMe(accessToken);
    },
  });
}

export function useCreateProviderServiceMe() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProviderServiceInput) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return createProviderServiceMe(input, accessToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.providers.services }),
        queryClient.invalidateQueries({ queryKey: ['providers', 'opportunities'] }),
      ]);
    },
  });
}

export function useUpdateProviderServiceMe() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, input }: { serviceId: string; input: UpdateProviderServiceInput }) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return updateProviderServiceMe(serviceId, input, accessToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.providers.services }),
        queryClient.invalidateQueries({ queryKey: ['providers', 'opportunities'] }),
      ]);
    },
  });
}

export function useDeleteProviderServiceMe() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return deleteProviderServiceMe(serviceId, accessToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.providers.services }),
        queryClient.invalidateQueries({ queryKey: ['providers', 'opportunities'] }),
      ]);
    },
  });
}

export function useAvailableRequests(filters?: AvailableRequestsFilters, enabled = true) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [
      'providers',
      'opportunities',
      filters?.serviceId ?? 'all',
      filters?.city ?? 'all',
      filters?.neighborhood ?? 'all',
    ] as const,
    enabled: isAuthenticated && Boolean(accessToken) && enabled,
    queryFn: () => {
      if (!accessToken) throw new Error('Você precisa estar autenticado.');
      return getAvailableRequests(accessToken, filters);
    },
  });
}
