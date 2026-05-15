import { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { cn } from '@/lib/utils/cn';

type PageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

export function PageShell({ title, description, children, className }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(26,95,122,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(208,77,35,0.1),transparent_42%)]">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <section className={cn('rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm sm:p-10', className)}>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
          {children ? <div className="mt-8">{children}</div> : null}
        </section>
      </main>
    </div>
  );
}
