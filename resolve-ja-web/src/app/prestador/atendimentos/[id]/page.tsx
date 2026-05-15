'use client';

import { useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AttendanceStatusPanel } from '@/features/attendance/components/AttendanceStatusPanel';
import { ProviderAttendanceActions } from '@/features/attendance/components/ProviderAttendanceActions';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { RequestMessages } from '@/features/messages/components/RequestMessages';
import { useRequest } from '@/features/requests/hooks';
import { formatDateTime } from '@/lib/utils/formatters';

export default function PrestadorAtendimentoDetalhePage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;
  const requestQuery = useRequest(requestId);

  if (requestQuery.isLoading) {
    return <PageContainer><LoadingState lines={5} /></PageContainer>;
  }

  if (requestQuery.isError || !requestQuery.data) {
    return <PageContainer><ErrorState message={mapAuthErrorMessage(requestQuery.error)} onRetry={() => { void requestQuery.refetch(); }} /></PageContainer>;
  }

  const request = requestQuery.data;

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Detalhe do atendimento"
        description="Fluxo operacional do atendimento selecionado."
      />

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{request.title}</h2>
          <StatusBadge status={request.status} />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Descrição" value={request.description || 'Sem descrição'} />
          <Info
            label="Orçamento"
            value={request.budget_cents !== null ? <MoneyDisplay cents={request.budget_cents} /> : 'Não informado'}
          />
          <Info
            label="Início desejado"
            value={request.desired_start_at ? formatDateTime(request.desired_start_at) : 'Não informado'}
          />
          <Info
            label="Local"
            value={[request.location_neighborhood, request.location_city, request.location_state].filter(Boolean).join(' - ') || 'Não disponível'}
          />
        </dl>
      </section>

      <AttendanceStatusPanel request={request} />
      <ProviderAttendanceActions request={request} />
      <RequestMessages requestId={request.id} />
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
