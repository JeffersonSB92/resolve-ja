'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAddresses,
  updateAddress,
} from '@/features/addresses/api';
import { CreateAddressInput, UpdateAddressInput } from '@/features/addresses/types';
import { useAuth } from '@/features/auth/hooks';
import { queryKeys } from '@/lib/query/keys';

export function useAddresses() {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.addresses,
    enabled: isAuthenticated && Boolean(accessToken),
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Access token not available.');
      }

      return getAddresses(accessToken);
    },
  });
}

export function useAddress(addressId?: string) {
  const { accessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['addresses', addressId] as const,
    enabled: isAuthenticated && Boolean(accessToken) && Boolean(addressId),
    queryFn: () => {
      if (!accessToken || !addressId) {
        throw new Error('Address id and token are required.');
      }

      return getAddressById(addressId, accessToken);
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (input: CreateAddressInput) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return createAddress(input, accessToken);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAddressInput }) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return updateAddress(id, input, accessToken);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      await queryClient.invalidateQueries({ queryKey: ['addresses', variables.id] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!accessToken) {
        throw new Error('Você precisa estar autenticado.');
      }

      return deleteAddress(id, accessToken);
    },
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      await queryClient.removeQueries({ queryKey: ['addresses', id] });
    },
  });
}
