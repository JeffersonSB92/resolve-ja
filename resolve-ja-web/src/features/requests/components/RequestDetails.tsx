'use client';

import { useState } from 'react';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AttendanceStatusPanel } from '@/features/attendance/components/AttendanceStatusPanel';
import { CustomerAttendanceActions } from '@/features/attendance/components/CustomerAttendanceActions';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { RequestMessages } from '@/features/messages/components/RequestMessages';
import { QuoteList } from '@/features/quotes/components/QuoteList';
import { RequestActions } from '@/features/requests/components/RequestActions';
import { RequestForm } from '@/features/requests/components/RequestForm';
import { RequestTimeline } from '@/features/requests/components/RequestTimeline';
import { useRequest } from '@/features/requests/hooks';
import { formatDateTime } from '@/lib/utils/formatters';

export function RequestDetails({ requestId }: { requestId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: request, isLoading, isError, error, refetch } = useRequest(requestId);

  if (isLoading) {
    return <LoadingState lines={5} />;
  }

  if (isError || !request) {
    return (
      <ErrorState
        message={mapAuthErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Criada em {formatDateTime(request.created_at)}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <InfoItem label="Descrição" value={request.description || 'Sem descrição'} />
          <InfoItem
            label="Orçamento"
            value={request.budget_cents !== null ? <MoneyDisplay cents={request.budget_cents} /> : 'Não informado'}
          />
          <InfoItem
            label="Início desejado"
            value={request.desired_start_at ? formatDateTime(request.desired_start_at) : 'Não informado'}
          />
          <InfoItem
            label="Fim desejado"
            value={request.desired_end_at ? formatDateTime(request.desired_end_at) : 'Não informado'}
          />
          <InfoItem
            label="Local"
            value={[request.location_neighborhood, request.location_city, request.location_state]
              .filter(Boolean)
              .join(' - ') || 'Não disponível'}
          />
        </dl>
      </section>

      <AttendanceStatusPanel request={request} />
      <CustomerAttendanceActions request={request} />

      <RequestActions
        request={request}
        isEditing={isEditing}
        onEditToggle={() => {
          setIsEditing((prev) => !prev);
        }}
      />

      {isEditing ? <RequestForm mode="edit" request={request} /> : null}

      <RequestTimeline request={request} />

      <QuoteList requestId={request.id} canAccept />

      <RequestMessages requestId={request.id} />

      <section className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
        Fluxos operacionais avançados e auditoria de campo serão adicionados nas próximas etapas.
      </section>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value: React.ReactNode;
};

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
