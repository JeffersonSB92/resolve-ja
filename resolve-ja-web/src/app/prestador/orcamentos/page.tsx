'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { QuoteCard } from '@/features/quotes/components/QuoteCard';
import { useProviderQuotes } from '@/features/quotes/hooks';

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'sent', label: 'Enviados' },
  { value: 'accepted', label: 'Aceitos' },
  { value: 'rejected', label: 'Recusados' },
  { value: 'withdrawn', label: 'Retirados' },
  { value: 'expired', label: 'Expirados' },
  { value: 'canceled', label: 'Cancelados' },
] as const;

export default function PrestadorOrcamentosPage() {
  const [status, setStatus] = useState<string>('all');
  const queryStatus = useMemo(() => (status === 'all' ? undefined : status), [status]);
  const quotesQuery = useProviderQuotes(queryStatus);

  if (quotesQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState lines={4} />
      </PageContainer>
    );
  }

  if (quotesQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          message={mapAuthErrorMessage(quotesQuery.error)}
          onRetry={() => {
            void quotesQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const quotes = quotesQuery.data ?? [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Meus orçamentos"
        description="Acompanhe propostas enviadas e retire orçamentos quando necessário."
        action={
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        }
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="Sem orçamentos"
          description="Você ainda não enviou orçamentos para as solicitações disponíveis."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              requestId={quote.request_id}
              canWithdraw
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
