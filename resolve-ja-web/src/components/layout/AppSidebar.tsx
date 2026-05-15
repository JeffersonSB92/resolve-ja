'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  FileWarning,
  FolderKanban,
  Gauge,
  LayoutGrid,
  MapPinHouse,
  Search,
  Shield,
  UserRoundCog,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type AppArea = 'solicitante' | 'prestador' | 'admin';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const areaMenus: Record<AppArea, NavItem[]> = {
  solicitante: [
    { href: '/solicitante', label: 'Dashboard', icon: LayoutGrid },
    { href: '/solicitante/enderecos', label: 'Endereços', icon: MapPinHouse },
    { href: '/solicitante/solicitacoes', label: 'Solicitações', icon: FolderKanban },
    { href: '/solicitante/nova-solicitacao', label: 'Nova solicitação', icon: ClipboardCheck },
  ],
  prestador: [
    { href: '/prestador', label: 'Dashboard', icon: LayoutGrid },
    { href: '/prestador/onboarding', label: 'Onboarding', icon: UserRoundCog },
    { href: '/prestador/servicos', label: 'Serviços', icon: Wrench },
    { href: '/prestador/oportunidades', label: 'Oportunidades', icon: Search },
    { href: '/prestador/atendimentos', label: 'Atendimentos', icon: ClipboardCheck },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: Gauge },
    { href: '/admin/prestadores', label: 'Prestadores', icon: UserRoundCog },
    { href: '/admin/solicitacoes', label: 'Solicitações', icon: FolderKanban },
    { href: '/admin/denuncias', label: 'Denúncias', icon: FileWarning },
    { href: '/admin/catalogo', label: 'Catálogo', icon: Shield },
  ],
};

function isItemActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  area: AppArea;
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({ area, className, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const items = areaMenus[area];

  return (
    <aside className={cn('h-full w-full border-r border-border/70 bg-card/90 p-4', className)}>
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">ResolveJá</p>
        <h2 className="mt-2 text-lg font-semibold capitalize">Área {area}</h2>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
