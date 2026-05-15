import { getApi, postApi } from '@/lib/api/client';
import { AdminReport, AdminRequest, PendingProvider } from '@/features/admin/types';

export function getPendingProviders(token: string): Promise<PendingProvider[]> {
  return getApi<PendingProvider[]>('/admin/providers/pending', { token });
}

export function approveProvider(id: string, token: string, note?: string): Promise<PendingProvider> {
  return postApi<PendingProvider, { note?: string }>(`/admin/providers/${id}/approve`, { note }, { token });
}

export function rejectProvider(id: string, token: string, reason?: string): Promise<PendingProvider> {
  return postApi<PendingProvider, { reason?: string }>(`/admin/providers/${id}/reject`, { reason }, { token });
}

export function suspendProvider(id: string, token: string, reason?: string): Promise<PendingProvider> {
  return postApi<PendingProvider, { reason?: string }>(`/admin/providers/${id}/suspend`, { reason }, { token });
}

export function getAdminRequests(token: string, status?: string): Promise<AdminRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return getApi<AdminRequest[]>(`/admin/requests${query}`, { token });
}

export function getAdminReports(token: string, status?: string): Promise<AdminReport[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return getApi<AdminReport[]>(`/admin/reports${query}`, { token });
}
