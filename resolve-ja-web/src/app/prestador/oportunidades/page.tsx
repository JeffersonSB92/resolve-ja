'use client';

import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useServices } from '@/features/catalog/hooks';
import { OpportunityCard } from '@/features/providers/components/OpportunityCard';
import { OpportunityFilters } from '@/features/providers/components/OpportunityFilters';
import { useAvailableRequests, useProviderProfileMe } from '@/features/providers/hooks';
import { AvailableRequestsFilters } from '@/features/providers/types';

export default function PrestadorOportunidadesPage() {
  const [filters, setFilters] = useState<AvailableRequestsFilters>({});
  const profileQuery = useProviderProfileMe();
  const servicesQuery = useServices();

  const isActive = profileQuery.data?.status === 'active';
  const opportunitiesQuery = useAvailableRequests(filters, isActive);

  const filtered = useMemo(() => {
    const list = opportunitiesQuery.data ?? [];

    return list.filter((item) => {
      const cityMatch = filters.city
        ? (item.locationCity ?? '').toLowerCase().includes(filters.city.toLowerCase())
        : true;
      const neighborhoodMatch = filters.neighborhood
        ? (item.locationNeighborhood ?? '').toLowerCase().includes(filters.neighborhood.toLowerCase())
        : true;

      return cityMatch && neighborhoodMatch;
    });
  }, [filters.city, filters.neighborhood, opportunitiesQuery.data]);

  if (profileQuery.isLoading || servicesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (profileQuery.isError || servicesQuery.isError) {
    const error = profileQuery.error ?? servicesQuery.error;
    return <PageContainer><ErrorState message={mapAuthErrorMessage(error)} onRetry={() => { void profileQuery.refetch(); void servicesQuery.refetch(); }} /></PageContainer>;
  }

  if (!isActive) {
    return (
      <PageContainer>
        <EmptyState
          title="Oportunidades indisponíveis"
          description="Seu perfil precisa estar ativo para acessar oportunidades de atendimento."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Oportunidades"
        description="Solicitações compatíveis com seu perfil e serviços cadastrados."
      />

      <OpportunityFilters
        values={filters}
        onChange={setFilters}
        services={servicesQuery.data ?? []}
      />

      {opportunitiesQuery.isLoading ? (
        <LoadingState lines={4} />
      ) : opportunitiesQuery.isError ? (
        <ErrorState
          message={mapAuthErrorMessage(opportunitiesQuery.error)}
          onRetry={() => {
            void opportunitiesQuery.refetch();
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma oportunidade encontrada"
          description="No momento não há solicitações compatíveis com seus filtros." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
