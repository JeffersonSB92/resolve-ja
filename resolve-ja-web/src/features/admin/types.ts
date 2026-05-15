export type PendingProvider = {
  id: string;
  user_id: string;
  status: string;
  verified_at: string | null;
  created_at?: string;
  updated_at?: string;
  display_name?: string;
  base_city?: string;
  base_state?: string;
  profiles?: {
    id?: string;
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type AdminRequest = {
  id: string;
  title?: string;
  status?: string;
  requester_id?: string;
  requester_name?: string | null;
  requester_profile?: {
    id?: string;
    full_name?: string | null;
  } | null;
  assigned_provider_id?: string | null;
  created_at?: string;
  desired_start_at?: string | null;
  budget_cents?: number | null;
  location_city?: string | null;
  location_state?: string | null;
  [key: string]: unknown;
};

export type AdminReport = {
  id: string;
  status?: string;
  created_at?: string;
  type?: string;
  reason?: string;
  request_id?: string;
  reporter_id?: string;
  [key: string]: unknown;
};

export type AdminSummary = {
  pendingProviders: number;
  totalRequests: number;
  openRequests: number;
  openReports: number;
};
