import { deleteApi, getApi, patchApi, postApi } from '@/lib/api/client';
import {
  AvailableRequest,
  AvailableRequestsFilters,
  CreateProviderProfileInput,
  CreateProviderServiceInput,
  ProviderProfile,
  ProviderService,
  UpdateProviderProfileInput,
  UpdateProviderServiceInput,
} from '@/features/providers/types';

function buildQuery(filters?: AvailableRequestsFilters): string {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.serviceId) params.set('serviceId', filters.serviceId);
  if (filters.city) params.set('city', filters.city);
  if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function createProviderProfile(
  input: CreateProviderProfileInput,
  token: string,
): Promise<ProviderProfile> {
  return postApi<ProviderProfile, CreateProviderProfileInput>('/providers/profile', input, { token });
}

export function getProviderProfileMe(token: string): Promise<ProviderProfile> {
  return getApi<ProviderProfile>('/providers/me', { token });
}

export function updateProviderProfileMe(
  input: UpdateProviderProfileInput,
  token: string,
): Promise<ProviderProfile> {
  return patchApi<ProviderProfile, UpdateProviderProfileInput>('/providers/me', input, { token });
}

export function createProviderServiceMe(
  input: CreateProviderServiceInput,
  token: string,
): Promise<ProviderService> {
  return postApi<ProviderService, CreateProviderServiceInput>('/providers/me/services', input, { token });
}

export function getProviderServicesMe(token: string): Promise<ProviderService[]> {
  return getApi<ProviderService[]>('/providers/me/services', { token });
}

export function updateProviderServiceMe(
  serviceId: string,
  input: UpdateProviderServiceInput,
  token: string,
): Promise<ProviderService> {
  return patchApi<ProviderService, UpdateProviderServiceInput>(
    `/providers/me/services/${serviceId}`,
    input,
    { token },
  );
}

export function deleteProviderServiceMe(serviceId: string, token: string): Promise<{ deleted: true }> {
  return deleteApi<{ deleted: true }>(`/providers/me/services/${serviceId}`, { token });
}

export function getAvailableRequests(
  token: string,
  filters?: AvailableRequestsFilters,
): Promise<AvailableRequest[]> {
  return getApi<AvailableRequest[]>(`/providers/available-requests${buildQuery(filters)}`, { token });
}
