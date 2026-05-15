'use client';

import { Search } from 'lucide-react';
import { Service } from '@/features/catalog/types';
import { AvailableRequestsFilters } from '@/features/providers/types';

type OpportunityFiltersProps = {
  values: AvailableRequestsFilters;
  onChange: (next: AvailableRequestsFilters) => void;
  services: Service[];
};

export function OpportunityFilters({ values, onChange, services }: OpportunityFiltersProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Filtros</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className={inputClassName}
          value={values.serviceId ?? ''}
          onChange={(event) => onChange({ ...values, serviceId: event.target.value || undefined })}
        >
          <option value="">Todos os serviços</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name ?? 'Serviço'}
            </option>
          ))}
        </select>

        <input
          className={inputClassName}
          placeholder="Cidade"
          value={values.city ?? ''}
          onChange={(event) => onChange({ ...values, city: event.target.value || undefined })}
        />

        <input
          className={inputClassName}
          placeholder="Bairro"
          value={values.neighborhood ?? ''}
          onChange={(event) => onChange({ ...values, neighborhood: event.target.value || undefined })}
        />
      </div>
    </section>
  );
}

const inputClassName =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';
