import { getApi, patchApi, postApi, deleteApi } from '@/lib/api/client';
import { Address, CreateAddressInput, UpdateAddressInput } from '@/features/addresses/types';

export function getAddresses(token: string): Promise<Address[]> {
  return getApi<Address[]>('/addresses', { token });
}

export function getAddressById(id: string, token: string): Promise<Address> {
  return getApi<Address>(`/addresses/${id}`, { token });
}

export function createAddress(input: CreateAddressInput, token: string): Promise<Address> {
  return postApi<Address, CreateAddressInput>('/addresses', input, { token });
}

export function updateAddress(
  id: string,
  input: UpdateAddressInput,
  token: string,
): Promise<Address> {
  return patchApi<Address, UpdateAddressInput>(`/addresses/${id}`, input, { token });
}

export function deleteAddress(id: string, token: string): Promise<{ deleted: true }> {
  return deleteApi<{ deleted: true }>(`/addresses/${id}`, { token });
}
