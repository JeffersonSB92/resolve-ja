import { CheckCircle2, Circle } from 'lucide-react';
import { ServiceRequest } from '@/features/requests/types';
import { cn } from '@/lib/utils/cn';

type Step = {
  key: string;
  label: string;
};

const steps: Step[] = [
  { key: 'open', label: 'Solicitação aberta' },
  { key: 'scheduled', label: 'Agendada' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'completed', label: 'Concluída' },
];

const statusOrder: Record<string, number> = {
  open: 0,
  scheduled: 1,
  provider_arrived: 1,
  awaiting_pin: 1,
  in_progress: 2,
  pending_confirmation: 2,
  completed: 3,
};

export function RequestTimeline({ request }: { request: ServiceRequest }) {
  const currentOrder = statusOrder[request.status] ?? 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold">Linha do tempo</h3>
      <ol className="space-y-3">
        {steps.map((step, index) => {
          const done = index <= currentOrder;

          return (
            <li key={step.key} className="flex items-center gap-3">
              {done ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
              <span className={cn('text-sm', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
