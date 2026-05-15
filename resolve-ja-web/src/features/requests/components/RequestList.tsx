'use client';

import { ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { useMyRequests } from '@/features/requests/hooks';

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Aberto' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'disputed', label: 'Disputa' },
] as const;

type RequestListProps = {
  compact?: boolean;
};

export function RequestList({ compact = false }: RequestListProps) {
  const [status, setStatus] = useState<string>('all');
  const queryStatus = useMemo(() => (status === 'all' ? undefined : status), [status]);
  const { data, isLoading, isError, error, refetch } = useMyRequests(queryStatus);

  if (isLoading) {
    return <LoadingState lines={4} />;
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

  const requests = data ?? [];
  const visibleRequests = compact ? requests.slice(0, 3) : requests;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Solicitações</h2>
        {!compact ? (
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
        ) : null}
      </div>

      {visibleRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma solicitação encontrada"
          description="Quando você criar solicitações, elas aparecerão aqui para acompanhamento."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </section>
  );
}
