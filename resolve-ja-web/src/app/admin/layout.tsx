import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute area="admin">
      <AppShell area="admin">{children}</AppShell>
    </ProtectedRoute>
  );
}
