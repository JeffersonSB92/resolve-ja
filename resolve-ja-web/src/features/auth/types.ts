import { Session } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ProviderProfile = {
  id: string;
  user_id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type MeResponse = {
  userId: string;
  email: string | null;
  profile: Profile | null;
  roles: string[];
  isAdmin: boolean;
  providerProfile: ProviderProfile | null;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthContextValue = {
  session: Session | null;
  accessToken: string | null;
  me: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<MeResponse | null>;
};
