'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { AdminRequestTable } from '@/features/admin/components/AdminRequestTable';
import { useAdminRequests } from '@/features/admin/hooks';
import { mapAuthErrorMessage } from '@/features/auth/api';

const options = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertas' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'canceled', label: 'Canceladas' },
] as const;

export default function AdminSolicitacoesPage() {
  const [status, setStatus] = useState('all');
  const queryStatus = useMemo(() => (status === 'all' ? undefined : status), [status]);
  const requestsQuery = useAdminRequests(queryStatus);

  if (requestsQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (requestsQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          message={mapAuthErrorMessage(requestsQuery.error)}
          onRetry={() => {
            void requestsQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const requests = requestsQuery.data ?? [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Solicitações"
        description="Monitore solicitações dos usuários com filtro de status operacional."
        action={
          <select
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        }
      />

      {requests.length === 0 ? (
        <EmptyState title="Sem solicitações" description="Nenhuma solicitação encontrada para o filtro atual." />
      ) : (
        <AdminRequestTable requests={requests} />
      )}
    </PageContainer>
  );
}
