'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { Service } from '@/features/catalog/types';
import { providerServiceSchema, ProviderServiceFormValues } from '@/features/providers/schemas';

type ProviderServiceSelectorProps = {
  services: Service[];
  linkedServiceIds: string[];
  isSubmitting?: boolean;
  onAdd: (values: ProviderServiceFormValues) => Promise<void>;
};

export function ProviderServiceSelector({
  services,
  linkedServiceIds,
  isSubmitting = false,
  onAdd,
}: ProviderServiceSelectorProps) {
  const form = useForm<ProviderServiceFormValues>({
    resolver: zodResolver(providerServiceSchema),
    defaultValues: {
      serviceId: '',
      basePriceCents: undefined,
      priceNotes: undefined,
    },
  });

  const availableServices = useMemo(
    () => services.filter((service) => !linkedServiceIds.includes(service.id)),
    [linkedServiceIds, services],
  );

  const submit = form.handleSubmit(async (values) => {
    try {
      await onAdd(values);
      toast.success('Serviço adicionado com sucesso.');
      form.reset({ serviceId: '', basePriceCents: undefined, priceNotes: undefined });
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Adicionar serviço</h2>

      <Field label="Serviço" error={form.formState.errors.serviceId?.message}>
        <select className={inputClassName} {...form.register('serviceId')}>
          <option value="">Selecione um serviço</option>
          {availableServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name ?? 'Serviço'}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Preço base (centavos)" error={form.formState.errors.basePriceCents?.message}>
          <input
            type="number"
            min={0}
            className={inputClassName}
            {...form.register('basePriceCents', { valueAsNumber: true })}
          />
        </Field>

        <Field label="Observações de preço" error={form.formState.errors.priceNotes?.message}>
          <input className={inputClassName} {...form.register('priceNotes')} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || availableServices.length === 0}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Adicionar serviço
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

const inputClassName =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';
