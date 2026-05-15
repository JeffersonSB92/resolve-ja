'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { providerProfileSchema, ProviderProfileFormValues } from '@/features/providers/schemas';
import { ProviderProfile } from '@/features/providers/types';

type ProviderProfileFormProps = {
  initialData?: ProviderProfile | null;
  isSubmitting?: boolean;
  onSubmit: (values: ProviderProfileFormValues) => Promise<void> | void;
};

function defaults(profile?: ProviderProfile | null): ProviderProfileFormValues {
  return {
    displayName: profile?.display_name ?? '',
    bio: profile?.bio ?? undefined,
    baseState: profile?.base_state ?? '',
    baseCity: profile?.base_city ?? '',
    baseNeighborhood: profile?.base_neighborhood ?? undefined,
    serviceRadiusKm: profile?.service_radius_km ?? undefined,
  };
}

export function ProviderProfileForm({ initialData, isSubmitting = false, onSubmit }: ProviderProfileFormProps) {
  const form = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: defaults(initialData),
  });

  useEffect(() => {
    form.reset(defaults(initialData));
  }, [form, initialData]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome de exibição" error={form.formState.errors.displayName?.message}>
          <input className={inputClassName} {...form.register('displayName')} />
        </Field>
        <Field label="Raio de atendimento (km)" error={form.formState.errors.serviceRadiusKm?.message}>
          <input
            type="number"
            min={1}
            className={inputClassName}
            {...form.register('serviceRadiusKm', { valueAsNumber: true })}
          />
        </Field>
      </div>

      <Field label="Bio" error={form.formState.errors.bio?.message}>
        <textarea rows={4} className={textareaClassName} {...form.register('bio')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Estado" error={form.formState.errors.baseState?.message}>
          <input className={inputClassName} {...form.register('baseState')} />
        </Field>
        <Field label="Cidade" error={form.formState.errors.baseCity?.message}>
          <input className={inputClassName} {...form.register('baseCity')} />
        </Field>
        <Field label="Bairro" error={form.formState.errors.baseNeighborhood?.message}>
          <input className={inputClassName} {...form.register('baseNeighborhood')} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
          {isSubmitting || form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Salvar perfil
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
const textareaClassName =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';
