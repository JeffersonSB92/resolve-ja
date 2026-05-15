'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/shared/LoadingState';
import { useAuth } from '@/features/auth/hooks';
import { AppArea } from '@/components/layout/AppSidebar';

type ProtectedRouteProps = {
  area: AppArea;
  children: ReactNode;
};

function isProviderOnboardingPath(pathname: string): boolean {
  return pathname === '/prestador/onboarding' || pathname.startsWith('/prestador/onboarding/');
}

export function ProtectedRoute({ area, children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const auth = useAuth();

  useEffect(() => {
    if (auth.isLoading || hasRedirected.current) {
      return;
    }

    if (!auth.isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    if (area === 'admin' && !auth.me?.isAdmin) {
      hasRedirected.current = true;
      router.replace('/dashboard');
      return;
    }

    if (area === 'prestador' && !auth.me?.providerProfile && !isProviderOnboardingPath(pathname)) {
      hasRedirected.current = true;
      router.replace('/prestador/onboarding');
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.me?.isAdmin, auth.me?.providerProfile, area, pathname, router]);

  if (auth.isLoading) {
    return <LoadingState lines={4} className="m-6" />;
  }

  if (!auth.isAuthenticated) {
    return <LoadingState lines={2} className="m-6" />;
  }

  if (area === 'admin' && !auth.me?.isAdmin) {
    return <LoadingState lines={2} className="m-6" />;
  }

  if (area === 'prestador' && !auth.me?.providerProfile && !isProviderOnboardingPath(pathname)) {
    return <LoadingState lines={2} className="m-6" />;
  }

  return <>{children}</>;
}
