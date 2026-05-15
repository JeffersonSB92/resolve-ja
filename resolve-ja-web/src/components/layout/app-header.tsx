import Link from 'next/link';
import { ShieldCheck, UserRoundCog, Wrench } from 'lucide-react';

const links = [
  { href: '/solicitante', label: 'Solicitante', icon: UserRoundCog },
  { href: '/prestador', label: 'Prestador', icon: Wrench },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
];

export function AppHeader() {
  return (
    <header className="border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          ResolveJa Web
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-border/70 p-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
