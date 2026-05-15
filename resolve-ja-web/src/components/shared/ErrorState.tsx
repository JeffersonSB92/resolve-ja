import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = 'Algo não saiu como esperado',
  message = 'Tivemos uma falha ao carregar os dados. Tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className,
}: ErrorStateProps) {
  return (
    <section className={cn('rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm', className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-700">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm text-rose-800/90">{message}</p>
          {onRetry ? (
            <Button className="mt-4" variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
