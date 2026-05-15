'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { useCategories, useServices } from '@/features/catalog/hooks';
import { mapAuthErrorMessage } from '@/features/auth/api';

export default function AdminCatalogoPage() {
  const categoriesQuery = useCategories();
  const servicesQuery = useServices();

  if (categoriesQuery.isLoading || servicesQuery.isLoading) {
    return <PageContainer><LoadingState lines={4} /></PageContainer>;
  }

  if (categoriesQuery.isError || servicesQuery.isError) {
    const error = categoriesQuery.error ?? servicesQuery.error;
    return <PageContainer><ErrorState message={mapAuthErrorMessage(error)} onRetry={() => { void categoriesQuery.refetch(); void servicesQuery.refetch(); }} /></PageContainer>;
  }

  const categories = categoriesQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title="Catálogo"
        description="Visualização administrativa (somente leitura) de categorias e serviços ativos."
      />

      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        TODO: não há endpoints administrativos específicos de catálogo na API atual. Esta visão permanece somente leitura.
      </section>

      {categories.length === 0 ? (
        <EmptyState title="Sem categorias" description="Nenhuma categoria foi encontrada no catálogo." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => {
            const linked = services.filter((service) => service.category_id === category.id);

            return (
              <article key={category.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <h3 className="text-base font-semibold tracking-tight">{category.name}</h3>
                <p className="text-xs text-muted-foreground">slug: {category.slug || '—'}</p>

                <ul className="mt-3 space-y-2">
                  {linked.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Sem serviços vinculados</li>
                  ) : (
                    linked.map((service) => (
                      <li key={service.id} className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
                        <p className="font-medium">{service.name || 'Serviço sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{service.description || 'Sem descrição'}</p>
                      </li>
                    ))
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
