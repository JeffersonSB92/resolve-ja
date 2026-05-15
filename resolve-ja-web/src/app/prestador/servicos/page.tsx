'use client';

import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useServices } from '@/features/catalog/hooks';
import { ProviderServiceCard } from '@/features/providers/components/ProviderServiceCard';
import { ProviderServiceSelector } from '@/features/providers/components/ProviderServiceSelector';
import { useCreateProviderServiceMe, useProviderProfileMe, useProviderServicesMe } from '@/features/providers/hooks';

export default function PrestadorServicosPage() {
  const profileQuery = useProviderProfileMe();
  const catalogQuery = useServices();
  const providerServicesQuery = useProviderServicesMe();
  const createServiceMutation = useCreateProviderServiceMe();

  if (profileQuery.isLoading || catalogQuery.isLoading || providerServicesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (profileQuery.isError || catalogQuery.isError || providerServicesQuery.isError) {
    const error = profileQuery.error ?? catalogQuery.error ?? providerServicesQuery.error;
    return <PageContainer><ErrorState message={mapAuthErrorMessage(error)} onRetry={() => { void profileQuery.refetch(); void catalogQuery.refetch(); void providerServicesQuery.refetch(); }} /></PageContainer>;
  }

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <PageContainer>
        <EmptyState
          title="Perfil não encontrado"
          description="Finalize seu onboarding para gerenciar os serviços oferecidos."
          action={<Button asChild><Link href="/prestador/onboarding">Ir para onboarding</Link></Button>}
        />
      </PageContainer>
    );
  }

  const catalog = catalogQuery.data ?? [];
  const providerServices = providerServicesQuery.data ?? [];
  const linkedIds = providerServices.map((item) => item.service_id);

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Serviços oferecidos"
        description="Selecione os serviços que você atende e configure preço base e observações."
      />

      <ProviderServiceSelector
        services={catalog}
        linkedServiceIds={linkedIds}
        isSubmitting={createServiceMutation.isPending}
        onAdd={(values) =>
          createServiceMutation.mutateAsync({
            serviceId: values.serviceId,
            basePriceCents: values.basePriceCents ?? null,
            priceNotes: values.priceNotes ?? null,
          })
        }
      />

      {providerServices.length === 0 ? (
        <EmptyState
          title="Nenhum serviço selecionado"
          description="Adicione ao menos um serviço para começar a receber oportunidades." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {providerServices.map((item) => (
            <ProviderServiceCard
              key={item.id}
              item={item}
              service={catalog.find((service) => service.id === item.service_id)}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
