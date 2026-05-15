'use client';

import Link from 'next/link';
import { AlertTriangle, ClipboardList, UserRoundCog, Users2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { AdminRequestTable } from '@/features/admin/components/AdminRequestTable';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { PendingProviderCard } from '@/features/admin/components/PendingProviderCard';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useAdminReports, useAdminRequests, usePendingProviders } from '@/features/admin/hooks';

export default function AdminDashboardPage() {
  const pendingQuery = usePendingProviders();
  const requestsQuery = useAdminRequests();
  const reportsQuery = useAdminReports();

  if (pendingQuery.isLoading || requestsQuery.isLoading || reportsQuery.isLoading) {
    return <PageContainer><LoadingState lines={5} /></PageContainer>;
  }

  if (pendingQuery.isError || requestsQuery.isError || reportsQuery.isError) {
    const error = pendingQuery.error ?? requestsQuery.error ?? reportsQuery.error;
    return (
      <PageContainer>
        <ErrorState
          message={mapAuthErrorMessage(error)}
          onRetry={() => {
            void pendingQuery.refetch();
            void requestsQuery.refetch();
            void reportsQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const pending = pendingQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const reports = reportsQuery.data ?? [];

  const openRequests = requests.filter((item) => item.status === 'open').length;
  const openReports = reports.filter((item) => item.status === 'open').length;

  return (
    <PageContainer className="space-y-5">
      <PageHeader title="Painel administrativo" description="Visão geral da operação, moderação e integridade da plataforma." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Prestadores pendentes" value={pending.length} icon={<Users2 className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Solicitações totais" value={requests.length} icon={<ClipboardList className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Solicitações abertas" value={openRequests} icon={<UserRoundCog className="size-4 text-muted-foreground" />} />
        <AdminStatCard label="Denúncias abertas" value={openReports} icon={<AlertTriangle className="size-4 text-muted-foreground" />} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Prestadores pendentes</h2>
          <Button asChild variant="ghost"><Link href="/admin/prestadores">Ver todos</Link></Button>
        </div>

        {pending.length === 0 ? (
          <EmptyState title="Sem pendências" description="Não há prestadores aguardando aprovação no momento." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.slice(0, 4).map((provider) => (
              <PendingProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Solicitações recentes</h2>
          <Button asChild variant="ghost"><Link href="/admin/solicitacoes">Abrir módulo</Link></Button>
        </div>
        <AdminRequestTable requests={requests.slice(0, 8)} />
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground shadow-sm">
        Denúncias abertas: <span className="font-semibold text-foreground">{openReports}</span>. Acesse
        {' '}
        <Link href="/admin/denuncias" className="font-medium text-primary hover:underline">/admin/denuncias</Link>
        {' '}
        para tratamento completo.
      </section>
    </PageContainer>
  );
}
