'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { PendingProviderCard } from '@/features/admin/components/PendingProviderCard';
import { usePendingProviders } from '@/features/admin/hooks';
import { mapAuthErrorMessage } from '@/features/auth/api';

export default function AdminPrestadoresPage() {
  const pendingQuery = usePendingProviders();

  if (pendingQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (pendingQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          message={mapAuthErrorMessage(pendingQuery.error)}
          onRetry={() => {
            void pendingQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const providers = pendingQuery.data ?? [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader title="Prestadores pendentes" description="Aprove, rejeite ou suspenda perfis com segurança e rastreabilidade." />

      {providers.length === 0 ? (
        <EmptyState title="Nenhum prestador pendente" description="Todos os cadastros já foram processados." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((provider) => (
            <PendingProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
