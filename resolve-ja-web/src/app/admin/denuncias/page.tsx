'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { AdminReportTable } from '@/features/admin/components/AdminReportTable';
import { useAdminReports } from '@/features/admin/hooks';
import { mapAuthErrorMessage } from '@/features/auth/api';

const options = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertas' },
  { value: 'in_review', label: 'Em análise' },
  { value: 'resolved', label: 'Resolvidas' },
  { value: 'dismissed', label: 'Descartadas' },
] as const;

export default function AdminDenunciasPage() {
  const [status, setStatus] = useState('all');
  const queryStatus = useMemo(() => (status === 'all' ? undefined : status), [status]);
  const reportsQuery = useAdminReports(queryStatus);

  if (reportsQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (reportsQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          message={mapAuthErrorMessage(reportsQuery.error)}
          onRetry={() => {
            void reportsQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const reports = reportsQuery.data ?? [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Denúncias"
        description="Acompanhe e trate denúncias de forma segura e auditável."
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

      {reports.length === 0 ? (
        <EmptyState title="Sem denúncias" description="Nenhuma denúncia encontrada para o filtro atual." />
      ) : (
        <AdminReportTable reports={reports} />
      )}
    </PageContainer>
  );
}
