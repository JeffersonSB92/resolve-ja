'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import { AuthContextValue } from '@/features/auth/types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>.');
  }

  return context;
}
