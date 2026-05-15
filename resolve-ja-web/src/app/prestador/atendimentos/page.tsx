'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useProviderQuotes } from '@/features/quotes/hooks';
import { useRequest } from '@/features/requests/hooks';

export default function PrestadorAtendimentosPage() {
  const quotesQuery = useProviderQuotes('accepted');

  if (quotesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (quotesQuery.isError) {
    return <PageContainer><ErrorState message={mapAuthErrorMessage(quotesQuery.error)} onRetry={() => { void quotesQuery.refetch(); }} /></PageContainer>;
  }

  const quotes = quotesQuery.data ?? [];

  if (quotes.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhum atendimento ativo"
          description="Quando seus orçamentos forem aceitos, os atendimentos aparecerão aqui." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Atendimentos"
        description="Gerencie check-in, início e conclusão dos serviços em andamento."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {quotes.map((quote) => (
          <AttendanceListCard key={quote.id} requestId={quote.request_id} />
        ))}
      </div>
    </PageContainer>
  );
}

function AttendanceListCard({ requestId }: { requestId: string }) {
  const requestQuery = useRequest(requestId);

  if (requestQuery.isLoading) {
    return <LoadingState lines={2} />;
  }

  if (requestQuery.isError || !requestQuery.data) {
    return <ErrorState message={mapAuthErrorMessage(requestQuery.error)} />;
  }

  const request = requestQuery.data;

  return (
    <Link
      href={`/prestador/atendimentos/${request.id}`}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{request.title}</h3>
        <StatusBadge status={request.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        {request.location_city || 'Cidade não informada'}
        {request.location_neighborhood ? ` - ${request.location_neighborhood}` : ''}
      </p>
    </Link>
  );
}
