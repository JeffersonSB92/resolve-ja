import { cn } from '@/lib/utils/cn';

type LoadingStateProps = {
  lines?: number;
  className?: string;
};

export function LoadingState({ lines = 3, className }: LoadingStateProps) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-6 shadow-sm', className)}>
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-40 rounded-md bg-muted" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={`skeleton-${index}`} className="h-4 w-full rounded-md bg-muted" />
        ))}
      </div>
    </section>
  );
}
