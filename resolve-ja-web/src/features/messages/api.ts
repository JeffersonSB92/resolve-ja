import { getApi, postApi } from '@/lib/api/client';
import { CreateMessageInput, RequestMessage } from '@/features/messages/types';

export function getRequestMessages(requestId: string, token: string): Promise<RequestMessage[]> {
  return getApi<RequestMessage[]>(`/requests/${requestId}/messages`, { token });
}

export function createRequestMessage(
  requestId: string,
  input: CreateMessageInput,
  token: string,
): Promise<RequestMessage> {
  return postApi<RequestMessage, CreateMessageInput>(`/requests/${requestId}/messages`, input, { token });
}
