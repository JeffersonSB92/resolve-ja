export type ProviderStatus =
  | 'pending_verification'
  | 'under_review'
  | 'active'
  | 'rejected'
  | 'suspended'
  | string;

export type ProviderProfile = {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  base_state: string;
  base_city: string;
  base_neighborhood: string | null;
  service_radius_km: number | null;
  status: ProviderStatus;
  verified_at: string | null;
  average_rating: number | null;
  rating_count: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type CreateProviderProfileInput = {
  displayName: string;
  bio?: string | null;
  baseState: string;
  baseCity: string;
  baseNeighborhood?: string | null;
  serviceRadiusKm?: number;
};

export type UpdateProviderProfileInput = Partial<CreateProviderProfileInput>;

export type ProviderService = {
  id: string;
  provider_id: string;
  service_id: string;
  base_price_cents: number | null;
  price_notes: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type CreateProviderServiceInput = {
  serviceId: string;
  basePriceCents?: number | null;
  priceNotes?: string | null;
};

export type UpdateProviderServiceInput = {
  basePriceCents?: number | null;
  priceNotes?: string | null;
  active?: boolean;
};

export type AvailableRequest = {
  id: string;
  title: string;
  description: string | null;
  service: {
    id: string;
    name: string | null;
    description: string | null;
  };
  locationState: string | null;
  locationCity: string | null;
  locationNeighborhood: string | null;
  desiredStartAt: string | null;
  desiredEndAt: string | null;
  budgetCents: number | null;
  createdAt: string;
};

export type AvailableRequestsFilters = {
  serviceId?: string;
  city?: string;
  neighborhood?: string;
};
