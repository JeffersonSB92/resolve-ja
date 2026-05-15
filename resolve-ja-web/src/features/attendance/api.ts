import { postApi } from '@/lib/api/client';
import { ServiceRequest } from '@/features/requests/types';
import {
  CheckInInput,
  GeneratePinOutput,
  StartRequestInput,
} from '@/features/attendance/types';

export function checkInRequest(requestId: string, input: CheckInInput, token: string): Promise<ServiceRequest> {
  return postApi<ServiceRequest, CheckInInput>(`/requests/${requestId}/check-in`, input, { token });
}

export function generatePin(requestId: string, token: string): Promise<GeneratePinOutput> {
  return postApi<GeneratePinOutput, Record<string, never>>(`/requests/${requestId}/generate-pin`, {}, { token });
}

export function startRequest(requestId: string, input: StartRequestInput, token: string): Promise<ServiceRequest> {
  return postApi<ServiceRequest, StartRequestInput>(`/requests/${requestId}/start`, input, { token });
}

export function markServiceDone(requestId: string, token: string): Promise<ServiceRequest> {
  return postApi<ServiceRequest, Record<string, never>>(`/requests/${requestId}/mark-done`, {}, { token });
}

export function confirmServiceCompletion(requestId: string, token: string): Promise<ServiceRequest> {
  return postApi<ServiceRequest, Record<string, never>>(
    `/requests/${requestId}/confirm-completion`,
    {},
    { token },
  );
}
