'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/shared/LoadingState';
import { useAuth } from '@/features/auth/hooks';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, me, activeRole } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (activeRole === 'admin') {
      router.replace('/admin');
      return;
    }

    if (activeRole === 'prestador') {
      const providerStatus = me?.providerProfile?.status;
      if (providerStatus === 'active') {
        router.replace('/prestador');
        return;
      }

      router.replace('/prestador/onboarding');
      return;
    }

    if (activeRole === 'solicitante') {
      router.replace('/solicitante');
      return;
    }

    const providerStatus = me?.providerProfile?.status;

    if (providerStatus === 'active') {
      router.replace('/prestador');
      return;
    }

    if (me?.providerProfile) {
      router.replace('/prestador/onboarding');
      return;
    }

    router.replace('/solicitante');
  }, [activeRole, isAuthenticated, isLoading, me, router]);

  return <LoadingState lines={3} className="m-6" />;
}
