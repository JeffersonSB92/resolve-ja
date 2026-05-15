'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { ProviderProfileForm } from '@/features/providers/components/ProviderProfileForm';
import { ProviderStatusCard } from '@/features/providers/components/ProviderStatusCard';
import {
  useCreateProviderProfile,
  useProviderProfileMe,
  useProviderServicesMe,
  useUpdateProviderProfileMe,
} from '@/features/providers/hooks';

export default function PrestadorOnboardingPage() {
  const profileQuery = useProviderProfileMe();
  const servicesQuery = useProviderServicesMe();
  const createMutation = useCreateProviderProfile();
  const updateMutation = useUpdateProviderProfileMe();

  if (profileQuery.isLoading || servicesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (profileQuery.isError) {
    return <PageContainer><ErrorState message={mapAuthErrorMessage(profileQuery.error)} onRetry={() => { void profileQuery.refetch(); }} /></PageContainer>;
  }

  const profile = profileQuery.data;
  const hasServices = (servicesQuery.data ?? []).length > 0;

  const handleCreate = async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Perfil de prestador criado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const handleUpdate = async (values: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success('Perfil atualizado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Onboarding do prestador"
        description="Complete seu perfil, selecione serviços e acompanhe o processo de aprovação."
      />

      {!profile ? (
        <ProviderProfileForm isSubmitting={createMutation.isPending} onSubmit={handleCreate} />
      ) : (
        <>
          <ProviderStatusCard profile={profile} hasServices={hasServices} />
          {(profile.status === 'rejected' || profile.status === 'suspended') ? (
            <ProviderProfileForm
              initialData={profile}
              isSubmitting={updateMutation.isPending}
              onSubmit={handleUpdate}
            />
          ) : null}
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/prestador/servicos">Gerenciar serviços</Link></Button>
            {profile.status === 'active' ? <Button asChild><Link href="/prestador/oportunidades">Ver oportunidades</Link></Button> : null}
          </div>
        </>
      )}
    </PageContainer>
  );
}
