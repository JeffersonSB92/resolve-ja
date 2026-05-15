'use client';

import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UserPreview = {
  name?: string | null;
  email?: string | null;
};

type AppHeaderProps = {
  areaLabel: string;
  user?: UserPreview | null;
  onLogout?: () => void;
  onOpenMobileNav: () => void;
};

function getUserInitials(user?: UserPreview | null): string {
  const raw = user?.name?.trim() || user?.email?.trim() || '';

  if (!raw) {
    return 'RJ';
  }

  const parts = raw.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function AppHeader({ areaLabel, user, onLogout, onOpenMobileNav }: AppHeaderProps) {
  const displayName = user?.name?.trim() || user?.email || 'Usuário';

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button className="lg:hidden" variant="outline" size="icon-sm" onClick={onOpenMobileNav}>
            <Menu className="size-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">ResolveJá</p>
            <p className="text-sm font-medium">{areaLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1.5 shadow-sm">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getUserInitials(user)}
          </div>
          <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline">
            {displayName}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onLogout}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
