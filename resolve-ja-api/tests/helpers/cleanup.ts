import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type IdRow = { id: string };

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function assertTestEnvironment(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanupTestData is allowed only when NODE_ENV is "test".');
  }
}

function isMissingDbObjectError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  if (error.code === '42P01' || error.code === '42703' || error.code === 'PGRST204') {
    return true;
  }

  const message = (error.message ?? '').toLowerCase();
  return message.includes('does not exist') || message.includes('could not find');
}

function createSupabaseAdminClient(): SupabaseClient {
  assertTestEnvironment();
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
const TEST_PREFIX = '[TEST]%';

async function listTestRequestIds(): Promise<string[]> {
  const { data, error } = await supabaseAdminClient
    .from('service_requests')
    .select('id')
    .like('title', TEST_PREFIX);

  if (error) {
    if (isMissingDbObjectError(error)) {
      return [];
    }
    throw new Error(`Failed to list test service requests: ${error.message}`);
  }

  return (data as IdRow[] | null)?.map((row) => row.id) ?? [];
}

async function deleteRowsByPrefix(table: string, column: string): Promise<void> {
  const { error } = await supabaseAdminClient
    .from(table)
    .delete()
    .like(column, TEST_PREFIX);

  if (error && !isMissingDbObjectError(error)) {
    throw new Error(`Failed to cleanup ${table}.${column}: ${error.message}`);
  }
}

async function deleteRowsByRequestIds(
  table: string,
  requestColumn: 'request_id' | 'service_request_id',
  requestIds: string[],
): Promise<void> {
  if (requestIds.length === 0) {
    return;
  }

  const { error } = await supabaseAdminClient
    .from(table)
    .delete()
    .in(requestColumn, requestIds);

  if (error && !isMissingDbObjectError(error)) {
    throw new Error(`Failed to cleanup ${table} by ${requestColumn}: ${error.message}`);
  }
}

async function deleteRowsByProviderServicePrefix(): Promise<void> {
  const { error } = await supabaseAdminClient
    .from('provider_services')
    .delete()
    .like('price_notes', TEST_PREFIX);

  if (error && !isMissingDbObjectError(error)) {
    throw new Error(`Failed to cleanup provider_services: ${error.message}`);
  }
}

export async function cleanupTestData(): Promise<void> {
  assertTestEnvironment();
  const testRequestIds = await listTestRequestIds();

  // Dependents of requests first.
  await deleteRowsByPrefix('messages', 'content');
  await deleteRowsByPrefix('messages', 'title');
  await deleteRowsByRequestIds('messages', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('messages', 'service_request_id', testRequestIds);

  await deleteRowsByRequestIds('provider_checkins', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('provider_checkins', 'service_request_id', testRequestIds);

  await deleteRowsByRequestIds('service_start_pins', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('service_start_pins', 'service_request_id', testRequestIds);

  await deleteRowsByRequestIds('payments', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('payments', 'service_request_id', testRequestIds);

  await deleteRowsByPrefix('quotes', 'title');
  await deleteRowsByPrefix('quotes', 'label');
  await deleteRowsByRequestIds('quotes', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('quotes', 'service_request_id', testRequestIds);
  await deleteRowsByRequestIds('request_quotes', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('request_quotes', 'service_request_id', testRequestIds);
  await deleteRowsByRequestIds('service_request_quotes', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('service_request_quotes', 'service_request_id', testRequestIds);

  await deleteRowsByRequestIds('reviews', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('reviews', 'service_request_id', testRequestIds);

  await deleteRowsByPrefix('reports', 'title');
  await deleteRowsByPrefix('reports', 'label');
  await deleteRowsByRequestIds('reports', 'request_id', testRequestIds);
  await deleteRowsByRequestIds('reports', 'service_request_id', testRequestIds);

  await deleteRowsByPrefix('service_requests', 'title');
  await deleteRowsByPrefix('service_requests', 'description');

  await deleteRowsByPrefix('user_addresses', 'label');
  await deleteRowsByPrefix('user_addresses', 'street');

  await deleteRowsByProviderServicePrefix();
}
