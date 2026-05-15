'use client';

import { ReactNode, useMemo, useState } from 'react';
import { AppArea, AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuth } from '@/features/auth/hooks';

type AppShellProps = {
  area: AppArea;
  children: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  onLogout?: () => void;
};

const areaLabels: Record<AppArea, string> = {
  solicitante: 'Área do Solicitante',
  prestador: 'Área do Prestador',
  admin: 'Área Administrativa',
};

export function AppShell({ area, children, user, onLogout }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { me, signOut } = useAuth();
  const areaLabel = useMemo(() => areaLabels[area], [area]);

  const currentUser = user ?? {
    name: me?.profile?.full_name ?? null,
    email: me?.email ?? null,
  };

  const handleLogout = onLogout ?? (() => void signOut());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(9,72,98,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(194,75,43,0.08),transparent_45%)]">
      <div className="flex min-h-screen">
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="fixed inset-y-0 w-72">
            <AppSidebar area={area} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            areaLabel={areaLabel}
            user={currentUser}
            onLogout={handleLogout}
            onOpenMobileNav={() => setMobileOpen(true)}
          />
          <main className="flex-1">{children}</main>
        </div>
      </div>

      <MobileNav area={area} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
