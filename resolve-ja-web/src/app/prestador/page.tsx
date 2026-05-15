'use client';

import Link from 'next/link';
import { BriefcaseBusiness, ReceiptText, Wrench } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { OpportunityCard } from '@/features/providers/components/OpportunityCard';
import { ProviderStatusCard } from '@/features/providers/components/ProviderStatusCard';
import { useAvailableRequests, useProviderProfileMe, useProviderServicesMe } from '@/features/providers/hooks';

export default function PrestadorPage() {
  const profileQuery = useProviderProfileMe();
  const servicesQuery = useProviderServicesMe();

  const profile = profileQuery.data;
  const isActive = profile?.status === 'active';
  const opportunitiesQuery = useAvailableRequests({}, isActive);

  if (profileQuery.isLoading || servicesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (profileQuery.isError) {
    return <PageContainer><ErrorState message={mapAuthErrorMessage(profileQuery.error)} onRetry={() => { void profileQuery.refetch(); }} /></PageContainer>;
  }

  if (!profile) {
    return (
      <PageContainer>
        <EmptyState
          title="Complete seu onboarding"
          description="Crie seu perfil de prestador para começar a receber oportunidades."
          action={<Button asChild><Link href="/prestador/onboarding">Iniciar onboarding</Link></Button>}
        />
      </PageContainer>
    );
  }

  const services = servicesQuery.data ?? [];
  const opportunities = isActive ? opportunitiesQuery.data ?? [] : [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Dashboard do prestador"
        description="Acompanhe seu status e oportunidades abertas na sua região."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/prestador/servicos"><Wrench className="size-4" />Gerenciar serviços</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/prestador/orcamentos"><ReceiptText className="size-4" />Meus orçamentos</Link>
            </Button>
          </div>
        )}
      />

      <ProviderStatusCard profile={profile} hasServices={services.length > 0} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Oportunidades recentes</h2>
          <Button asChild variant="ghost"><Link href="/prestador/oportunidades">Ver todas</Link></Button>
        </div>

        {!isActive ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Oportunidades indisponíveis"
            description="Seu perfil precisa estar ativo para visualizar oportunidades." />
        ) : opportunitiesQuery.isLoading ? (
          <LoadingState lines={3} />
        ) : opportunitiesQuery.isError ? (
          <ErrorState message={mapAuthErrorMessage(opportunitiesQuery.error)} onRetry={() => { void opportunitiesQuery.refetch(); }} />
        ) : opportunities.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Sem oportunidades no momento"
            description="Assim que surgirem solicitações compatíveis, elas aparecerão aqui." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {opportunities.slice(0, 3).map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
