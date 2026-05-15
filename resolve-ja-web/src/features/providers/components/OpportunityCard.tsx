import { Calendar, MapPin } from 'lucide-react';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { SendQuoteDialog } from '@/features/quotes/components/SendQuoteDialog';
import { AvailableRequest } from '@/features/providers/types';
import { formatDateTime } from '@/lib/utils/formatters';

export function OpportunityCard({ item }: { item: AvailableRequest }) {
  const place = [item.locationNeighborhood, item.locationCity].filter(Boolean).join(' - ');

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
      {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}

      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p>Serviço: {item.service.name ?? 'Serviço'}</p>
        {place ? (
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {place}
          </p>
        ) : null}
        {item.desiredStartAt ? (
          <p className="flex items-center gap-2">
            <Calendar className="size-4" />
            {formatDateTime(item.desiredStartAt)}
          </p>
        ) : null}
        {item.budgetCents !== null ? (
          <p>
            Orçamento: <MoneyDisplay cents={item.budgetCents} className="font-medium text-foreground" />
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <SendQuoteDialog requestId={item.id} />
      </div>
    </article>
  );
}
