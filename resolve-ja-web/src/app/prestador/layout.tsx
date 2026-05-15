import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

type PrestadorLayoutProps = {
  children: ReactNode;
};

export default function PrestadorLayout({ children }: PrestadorLayoutProps) {
  return (
    <ProtectedRoute area="prestador">
      <AppShell area="prestador">{children}</AppShell>
    </ProtectedRoute>
  );
}
