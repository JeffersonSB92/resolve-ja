import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { ModuleGrid } from '@/components/shared/module-grid';
import { Button } from '@/components/ui/button';

const shortcuts = [
  { href: '/login', label: 'Entrar' },
  { href: '/cadastro', label: 'Criar conta' },
  { href: '/dashboard', label: 'Abrir dashboard' },
];

export default function HomePage() {
  return (
    <PageShell
      title="ResolveJa Web"
      description="Base frontend modular com Next.js App Router, TanStack Query e Shadcn/UI pronta para consumir a resolve-ja-api."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {shortcuts.map((shortcut) => (
          <Button key={shortcut.href} asChild>
            <Link href={shortcut.href}>
              {shortcut.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ))}
      </div>
      <ModuleGrid />
    </PageShell>
  );
}
