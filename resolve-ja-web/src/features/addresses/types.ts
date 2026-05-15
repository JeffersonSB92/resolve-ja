export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  postal_code: string | null;
  state: string;
  city: string;
  neighborhood: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type CreateAddressInput = {
  label?: string | null;
  postalCode?: string;
  state: string;
  city: string;
  neighborhood?: string | null;
  street: string;
  number?: string | null;
  complement?: string | null;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;
