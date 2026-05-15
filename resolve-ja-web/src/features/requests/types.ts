export type RequestStatus =
  | 'open'
  | 'scheduled'
  | 'in_progress'
  | 'provider_arrived'
  | 'awaiting_pin'
  | 'pending_confirmation'
  | 'completed'
  | 'canceled'
  | 'disputed';

export type ServiceRequest = {
  id: string;
  requester_id: string;
  service_id: string;
  address_id: string;
  title: string;
  description: string | null;
  status: RequestStatus | string;
  assigned_provider_id: string | null;
  accepted_quote_id: string | null;
  desired_start_at: string | null;
  desired_end_at: string | null;
  budget_cents: number | null;
  location_state: string | null;
  location_city: string | null;
  location_neighborhood: string | null;
  cancelled_at: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type CreateRequestInput = {
  serviceId: string;
  addressId: string;
  title: string;
  description?: string | null;
  desiredStartAt?: string;
  desiredEndAt?: string;
  budgetCents?: number;
};

export type UpdateRequestInput = Partial<
  Pick<
    CreateRequestInput,
    'title' | 'description' | 'desiredStartAt' | 'desiredEndAt' | 'budgetCents'
  >
>;

export type CancelRequestInput = {
  reason?: string;
};
