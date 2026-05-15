import { supabaseAdminClient } from '../../config/supabase.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  AdminReportsQuery,
  AdminRequestsQuery,
} from './admin.schemas.js';

type ProviderProfileRow = {
  id: string;
  user_id: string;
  status: string;
  verified_at: string | null;
  created_at?: string;
  updated_at?: string;
  display_name?: string | null;
  base_city?: string | null;
  base_state?: string | null;
  [key: string]: unknown;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

const uuidV4LikeRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNoRowsError(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST116';
}

async function getProviderProfileByIdOrThrow(id: string): Promise<ProviderProfileRow> {
  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error && !isNoRowsError(error)) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Failed to load provider profile.',
      500,
      error,
    );
  }

  if (!data) {
    throw AppError.notFound('Provider profile');
  }

  return data as ProviderProfileRow;
}

export async function listPendingProviders(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .select('id, user_id, status, verified_at, created_at, updated_at, display_name, base_city, base_state')
    .in('status', ['pending_verification', 'under_review'])
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Failed to load pending providers.',
      500,
      error,
    );
  }

  const providers = (data ?? []) as ProviderProfileRow[];
  const userIds = providers
    .map((provider) => provider.user_id)
    .filter(
      (userId): userId is string =>
        typeof userId === 'string' &&
        userId.length > 0 &&
        uuidV4LikeRegex.test(userId),
    );

  if (userIds.length === 0) {
    return providers;
  }

  const { data: profilesData, error: profilesError } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name, phone, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    return providers.map((provider) => ({
      ...provider,
      profiles: null,
    }));
  }

  const profileById = new Map<string, ProfileRow>(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return providers.map((provider) => ({
    ...provider,
    profiles: profileById.get(provider.user_id) ?? null,
  }));
}

export async function approveProviderProfile(
  id: string,
): Promise<ProviderProfileRow> {
  await getProviderProfileByIdOrThrow(id);

  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .update({
      status: 'active',
      verified_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Failed to approve provider profile.',
      500,
      error,
    );
  }

  return data as ProviderProfileRow;
}

export async function rejectProviderProfile(
  id: string,
): Promise<ProviderProfileRow> {
  await getProviderProfileByIdOrThrow(id);

  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .update({
      status: 'rejected',
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Failed to reject provider profile.',
      500,
      error,
    );
  }

  return data as ProviderProfileRow;
}

export async function suspendProviderProfile(
  id: string,
): Promise<ProviderProfileRow> {
  await getProviderProfileByIdOrThrow(id);

  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .update({
      status: 'suspended',
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Failed to suspend provider profile.',
      500,
      error,
    );
  }

  return data as ProviderProfileRow;
}

export async function listAdminRequests(
  query: AdminRequestsQuery,
): Promise<Record<string, unknown>[]> {
  let dbQuery = supabaseAdminClient
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to load requests.', 500, error);
  }

  const requests = (data ?? []) as Array<Record<string, unknown>>;
  const requesterIds = requests
    .map((request) => (typeof request.requester_id === 'string' ? request.requester_id : null))
    .filter(
      (requesterId): requesterId is string =>
        requesterId !== null && uuidV4LikeRegex.test(requesterId),
    );

  if (requesterIds.length === 0) {
    return requests;
  }

  const { data: profilesData, error: profilesError } = await supabaseAdminClient
    .from('profiles')
    .select('id, full_name')
    .in('id', requesterIds);

  if (profilesError) {
    return requests;
  }

  const profileById = new Map<string, ProfileRow>(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return requests.map((request) => {
    const requesterId = typeof request.requester_id === 'string' ? request.requester_id : null;
    const requesterProfile = requesterId ? profileById.get(requesterId) ?? null : null;

    return {
      ...request,
      requester_profile: requesterProfile,
      requester_name: requesterProfile?.full_name ?? null,
    };
  });
}

export async function listAdminReports(
  query: AdminReportsQuery,
): Promise<Record<string, unknown>[]> {
  let dbQuery = supabaseAdminClient
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to load reports.', 500, error);
  }

  return (data ?? []) as Record<string, unknown>[];
}
