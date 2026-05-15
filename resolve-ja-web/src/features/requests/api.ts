import { getApi, patchApi, postApi } from '@/lib/api/client';
import {
  CancelRequestInput,
  CreateRequestInput,
  ServiceRequest,
  UpdateRequestInput,
} from '@/features/requests/types';

export function createRequest(input: CreateRequestInput, token: string): Promise<ServiceRequest> {
  return postApi<ServiceRequest, CreateRequestInput>('/requests', input, { token });
}

export function getMyRequests(token: string, status?: string): Promise<ServiceRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return getApi<ServiceRequest[]>(`/requests/my${query}`, { token });
}

export function getRequestById(id: string, token: string): Promise<ServiceRequest> {
  return getApi<ServiceRequest>(`/requests/${id}`, { token });
}

export function updateRequest(
  id: string,
  input: UpdateRequestInput,
  token: string,
): Promise<ServiceRequest> {
  return patchApi<ServiceRequest, UpdateRequestInput>(`/requests/${id}`, input, { token });
}

export function cancelRequest(
  id: string,
  input: CancelRequestInput,
  token: string,
): Promise<ServiceRequest> {
  return postApi<ServiceRequest, CancelRequestInput>(`/requests/${id}/cancel`, input, { token });
}
