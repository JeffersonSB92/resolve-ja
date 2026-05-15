import { createClient } from '@supabase/supabase-js';

type AuthUser = {
  userId: string;
  email: string;
  accessToken: string;
};

type Credentials = {
  email: string;
  password: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readTestCredentials(prefix: string): Credentials {
  return {
    email: readRequiredEnv(`${prefix}_EMAIL`),
    password: readRequiredEnv(`${prefix}_PASSWORD`),
  };
}

const supabaseUrl = readRequiredEnv('SUPABASE_URL');
const supabaseAnonKey = readRequiredEnv('SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export async function signInTestUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    const errorMessage = error?.message ?? 'Unknown authentication error.';
    throw new Error(
      `Failed to sign in test user "${email}": ${errorMessage}`,
    );
  }

  if (!data.user.email) {
    throw new Error(`Supabase user "${data.user.id}" has no email.`);
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    accessToken: data.session.access_token,
  };
}

export async function signInAdmin(): Promise<AuthUser> {
  const credentials = readTestCredentials('TEST_ADMIN');
  return signInTestUser(credentials.email, credentials.password);
}

export async function signInCustomer(): Promise<AuthUser> {
  const credentials = readTestCredentials('TEST_CUSTOMER');
  return signInTestUser(credentials.email, credentials.password);
}

export async function signInProvider(): Promise<AuthUser> {
  const credentials = readTestCredentials('TEST_PROVIDER');
  return signInTestUser(credentials.email, credentials.password);
}

export async function signInPendingProvider(): Promise<AuthUser> {
  const credentials = readTestCredentials('TEST_PENDING_PROVIDER');
  return signInTestUser(credentials.email, credentials.password);
}

export async function signInOtherUser(): Promise<AuthUser> {
  const credentials = readTestCredentials('TEST_OTHER_USER');
  return signInTestUser(credentials.email, credentials.password);
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
