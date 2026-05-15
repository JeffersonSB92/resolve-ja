import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ServiceRequest } from '@/features/requests/types';
import { formatDateTime } from '@/lib/utils/formatters';

function formatLocation(request: ServiceRequest): string | null {
  const city = request.location_city;
  const neighborhood = request.location_neighborhood;

  if (!city && !neighborhood) {
    return null;
  }

  if (city && neighborhood) {
    return `${neighborhood}, ${city}`;
  }

  return city || neighborhood;
}

export function RequestCard({ request }: { request: ServiceRequest }) {
  const location = formatLocation(request);

  return (
    <Link
      href={`/solicitante/solicitacoes/${request.id}`}
      className="block rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight">{request.title}</h3>
        <StatusBadge status={request.status} />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {request.desired_start_at ? (
          <p className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>{formatDateTime(request.desired_start_at)}</span>
          </p>
        ) : null}

        {request.budget_cents !== null ? (
          <p>
            Orçamento: <MoneyDisplay cents={request.budget_cents} className="font-medium text-foreground" />
          </p>
        ) : null}

        {location ? (
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>{location}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
