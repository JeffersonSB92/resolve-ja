import { getApi } from '@/lib/api/client';
import { Service, ServiceCategory } from '@/features/catalog/types';

export function getCategories(): Promise<ServiceCategory[]> {
  return getApi<ServiceCategory[]>('/categories');
}

export function getServices(categoryId?: string): Promise<Service[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return getApi<Service[]>(`/services${query}`);
}

export function getServiceById(id: string): Promise<Service> {
  return getApi<Service>(`/services/${id}`);
}
