'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories, getServiceById, getServices } from '@/features/catalog/api';
import { queryKeys } from '@/lib/query/keys';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => getCategories(),
  });
}

export function useServices(categoryId?: string) {
  return useQuery({
    queryKey: queryKeys.catalog.services(categoryId),
    queryFn: () => getServices(categoryId),
  });
}

export function useService(serviceId?: string) {
  return useQuery({
    queryKey: ['catalog', 'service', serviceId] as const,
    queryFn: () => {
      if (!serviceId) {
        throw new Error('serviceId is required.');
      }

      return getServiceById(serviceId);
    },
    enabled: Boolean(serviceId),
  });
}
