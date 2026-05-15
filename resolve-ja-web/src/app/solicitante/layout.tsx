import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

type SolicitanteLayoutProps = {
  children: ReactNode;
};

export default function SolicitanteLayout({ children }: SolicitanteLayoutProps) {
  return (
    <ProtectedRoute area="solicitante">
      <AppShell area="solicitante">{children}</AppShell>
    </ProtectedRoute>
  );
}
