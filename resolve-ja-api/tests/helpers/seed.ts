import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import { postJson } from './http.js';

type ServiceRow = {
  id: string;
  name: string | null;
  slug: string | null;
  active: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
};

type ProviderProfileRow = {
  id: string;
  user_id: string;
  status: string;
  verified_at: string | null;
};

type ProviderServiceRow = {
  id: string;
  provider_id: string;
  service_id: string;
  base_price_cents: number | null;
  price_notes: string | null;
  active: boolean;
};

type AddressPayload = {
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

type CreatedAddress = {
  id: string;
  [key: string]: unknown;
};

type RequestPayload = {
  serviceId: string;
  addressId: string;
  title: string;
  description?: string | null;
  desiredStartAt?: string;
  desiredEndAt?: string;
  budgetCents?: number;
};

type CreatedRequest = {
  id: string;
  [key: string]: unknown;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function assertTestEnvironment(context: string): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`${context} is allowed only when NODE_ENV is "test".`);
  }
}

function createSupabaseAdminClient(): SupabaseClient {
  assertTestEnvironment('Supabase admin helpers');
  const supabaseUrl = readRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const supabaseAdminClient = createSupabaseAdminClient();

export async function getActiveServiceBySlug(slug: string): Promise<ServiceRow> {
  const { data, error } = await supabaseAdminClient
    .from('services')
    .select('id, name, slug, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load active service by slug "${slug}": ${error.message}`);
  }

  if (!data) {
    throw new Error(`Active service not found for slug "${slug}".`);
  }

  return data as ServiceRow;
}

export async function getActiveService(): Promise<ServiceRow> {
  const { data, error } = await supabaseAdminClient
    .from('services')
    .select('id, name, slug, active')
    .eq('active', true)
    .order('name', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load an active service: ${error.message}`);
  }

  if (!data) {
    throw new Error('No active service found in services table.');
  }

  return data as ServiceRow;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow> {
  const { data, error } = await supabaseAdminClient
    .from('service_categories')
    .select('id, name, slug, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load category by slug "${slug}": ${error.message}`);
  }

  if (!data) {
    throw new Error(`Active category not found for slug "${slug}".`);
  }

  return data as CategoryRow;
}

export async function ensureTestProviderIsActive(
  providerUserId: string,
): Promise<ProviderProfileRow> {
  assertTestEnvironment('ensureTestProviderIsActive');

  const { data: provider, error: providerError } = await supabaseAdminClient
    .from('provider_profiles')
    .select('id, user_id, status, verified_at')
    .eq('user_id', providerUserId)
    .maybeSingle();

  if (providerError) {
    throw new Error(`Failed to load provider profile: ${providerError.message}`);
  }

  if (!provider) {
    throw new Error(`Provider profile not found for user "${providerUserId}".`);
  }

  if (provider.status === 'active') {
    return provider as ProviderProfileRow;
  }

  const { data: updatedProvider, error: updateError } = await supabaseAdminClient
    .from('provider_profiles')
    .update({
      status: 'active',
      verified_at: new Date().toISOString(),
    })
    .eq('id', provider.id)
    .select('id, user_id, status, verified_at')
    .single();

  if (updateError) {
    throw new Error(`Failed to activate provider profile "${provider.id}": ${updateError.message}`);
  }

  return updatedProvider as ProviderProfileRow;
}

export async function getProviderProfileByUserIdForTest(
  userId: string,
): Promise<ProviderProfileRow | null> {
  assertTestEnvironment('getProviderProfileByUserIdForTest');

  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .select('id, user_id, status, verified_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load provider profile: ${error.message}`);
  }

  return (data as ProviderProfileRow | null) ?? null;
}

export async function ensureProviderStatusForTest(
  userId: string,
  status: 'active' | 'pending_verification' | 'rejected' | 'suspended',
): Promise<ProviderProfileRow> {
  assertTestEnvironment('ensureProviderStatusForTest');

  const existing = await getProviderProfileByUserIdForTest(userId);

  if (existing) {
    const { data, error } = await supabaseAdminClient
      .from('provider_profiles')
      .update({ status })
      .eq('id', existing.id)
      .select('id, user_id, status, verified_at')
      .single();

    if (error) {
      throw new Error(`Failed to update provider profile: ${error.message}`);
    }

    return data as ProviderProfileRow;
  }

  const { data, error } = await supabaseAdminClient
    .from('provider_profiles')
    .insert({
      user_id: userId,
      display_name: '[TEST] Provider Profile',
      base_state: 'RS',
      base_city: 'Passo Fundo',
      status,
    })
    .select('id, user_id, status, verified_at')
    .single();

  if (error) {
    throw new Error(`Failed to create provider profile: ${error.message}`);
  }

  return data as ProviderProfileRow;
}

export async function ensureTestProviderService(
  providerId: string,
  serviceId: string,
): Promise<ProviderServiceRow> {
  assertTestEnvironment('ensureTestProviderService');

  const { data: existing, error: existingError } = await supabaseAdminClient
    .from('provider_services')
    .select('id, provider_id, service_id, base_price_cents, price_notes, active')
    .eq('provider_id', providerId)
    .eq('service_id', serviceId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to verify provider service: ${existingError.message}`);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabaseAdminClient
      .from('provider_services')
      .update({
        active: true,
        price_notes: existing.price_notes ?? '[TEST] provider service',
      })
      .eq('id', existing.id)
      .select('id, provider_id, service_id, base_price_cents, price_notes, active')
      .single();

    if (updateError) {
      throw new Error(`Failed to update provider service "${existing.id}": ${updateError.message}`);
    }

    return updated as ProviderServiceRow;
  }

  const { data: created, error: createError } = await supabaseAdminClient
    .from('provider_services')
    .insert({
      provider_id: providerId,
      service_id: serviceId,
      active: true,
      price_notes: '[TEST] provider service',
    })
    .select('id, provider_id, service_id, base_price_cents, price_notes, active')
    .single();

  if (createError) {
    throw new Error(`Failed to create provider service: ${createError.message}`);
  }

  return created as ProviderServiceRow;
}

export async function setProviderServiceActiveStateForTest(
  providerId: string,
  serviceId: string,
  active: boolean,
): Promise<void> {
  assertTestEnvironment('setProviderServiceActiveStateForTest');

  const { error } = await supabaseAdminClient
    .from('provider_services')
    .update({ active })
    .eq('provider_id', providerId)
    .eq('service_id', serviceId);

  if (error) {
    throw new Error(`Failed to update provider service state: ${error.message}`);
  }
}

export async function deleteProviderProfileIfTestOwnedForTest(
  userId: string,
): Promise<boolean> {
  assertTestEnvironment('deleteProviderProfileIfTestOwnedForTest');

  const profile = await getProviderProfileByUserIdForTest(userId);

  if (!profile) {
    return true;
  }

  const { data: fullProfile, error: fullProfileError } = await supabaseAdminClient
    .from('provider_profiles')
    .select('id, display_name')
    .eq('id', profile.id)
    .single();

  if (fullProfileError) {
    throw new Error(`Failed to load provider profile details: ${fullProfileError.message}`);
  }

  const displayName =
    typeof fullProfile.display_name === 'string' ? fullProfile.display_name : '';

  if (!displayName.startsWith('[TEST]')) {
    return false;
  }

  const { error: servicesError } = await supabaseAdminClient
    .from('provider_services')
    .delete()
    .eq('provider_id', profile.id);

  if (servicesError) {
    throw new Error(`Failed to delete provider services: ${servicesError.message}`);
  }

  const { error: profileError } = await supabaseAdminClient
    .from('provider_profiles')
    .delete()
    .eq('id', profile.id)
    .eq('user_id', userId);

  if (profileError) {
    throw new Error(`Failed to delete provider profile: ${profileError.message}`);
  }

  return true;
}

export async function createTestAddress(
  app: FastifyInstance,
  token: string,
  overrides?: Partial<AddressPayload>,
): Promise<CreatedAddress> {
  const payload: AddressPayload = {
    label: '[TEST] address',
    state: 'RS',
    city: 'Passo Fundo',
    neighborhood: 'Centro',
    street: 'Rua Teste',
    number: '100',
    complement: null,
    isDefault: false,
    ...overrides,
  };

  const response = await postJson<AddressPayload, { success?: boolean; data?: CreatedAddress }>(
    app,
    '/addresses',
    token,
    payload,
  );

  if (response.statusCode !== 200 || !response.body.success || !response.body.data?.id) {
    throw new Error(
      `Failed to create test address via API. Status: ${response.statusCode}.`,
    );
  }

  return response.body.data;
}

export async function createTestRequest(
  app: FastifyInstance,
  token: string,
  addressId: string,
  serviceId: string,
  overrides?: Partial<RequestPayload>,
): Promise<CreatedRequest> {
  const payload: RequestPayload = {
    serviceId,
    addressId,
    title: '[TEST] request',
    description: '[TEST] integration request',
    budgetCents: 15000,
    ...overrides,
  };

  const response = await postJson<RequestPayload, { success?: boolean; data?: CreatedRequest }>(
    app,
    '/requests',
    token,
    payload,
  );

  if (response.statusCode !== 201 || !response.body.success || !response.body.data?.id) {
    throw new Error(
      `Failed to create test request via API. Status: ${response.statusCode}.`,
    );
  }

  return response.body.data;
}
