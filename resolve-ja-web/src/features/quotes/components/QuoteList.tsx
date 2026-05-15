'use client';

import { FileSearch } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useRequestQuotes } from '@/features/quotes/hooks';
import { QuoteCard } from '@/features/quotes/components/QuoteCard';

type QuoteListProps = {
  requestId: string;
  canAccept?: boolean;
};

export function QuoteList({ requestId, canAccept = true }: QuoteListProps) {
  const { data, isLoading, isError, error, refetch } = useRequestQuotes(requestId);

  if (isLoading) {
    return <LoadingState lines={3} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={mapAuthErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const quotes = data ?? [];

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Ainda não há orçamentos"
        description="Assim que prestadores enviarem propostas, você poderá comparar e escolher a melhor opção."
      />
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Orçamentos recebidos</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} requestId={requestId} canAccept={canAccept} />
        ))}
      </div>
    </section>
  );
}
