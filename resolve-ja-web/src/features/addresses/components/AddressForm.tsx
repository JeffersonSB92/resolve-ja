'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { AddressFormValues, addressFormSchema } from '@/features/addresses/schemas';
import { Address } from '@/features/addresses/types';

type AddressFormProps = {
  initialData?: Address | null;
  isSubmitting?: boolean;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

function toDefaultValues(initialData?: Address | null): AddressFormValues {
  if (!initialData) {
    return {
      label: undefined,
      postalCode: undefined,
      state: '',
      city: '',
      neighborhood: undefined,
      street: '',
      number: undefined,
      complement: undefined,
      isDefault: false,
    };
  }

  return {
    label: initialData.label,
    postalCode: initialData.postal_code ?? undefined,
    state: initialData.state,
    city: initialData.city,
    neighborhood: initialData.neighborhood,
    street: initialData.street,
    number: initialData.number,
    complement: initialData.complement,
    isDefault: initialData.is_default,
  };
}

export function AddressForm({ initialData, isSubmitting = false, onSubmit, onCancel }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: toDefaultValues(initialData),
  });

  useEffect(() => {
    form.reset(toDefaultValues(initialData));
  }, [form, initialData]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rótulo" error={form.formState.errors.label?.message}>
          <input className={inputClassName} {...form.register('label')} placeholder="Casa, trabalho..." />
        </Field>

        <Field label="CEP" error={form.formState.errors.postalCode?.message}>
          <input className={inputClassName} {...form.register('postalCode')} placeholder="00000-000" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estado" error={form.formState.errors.state?.message}>
          <input className={inputClassName} {...form.register('state')} placeholder="SP" />
        </Field>

        <Field label="Cidade" error={form.formState.errors.city?.message}>
          <input className={inputClassName} {...form.register('city')} placeholder="São Paulo" />
        </Field>
      </div>

      <Field label="Bairro" error={form.formState.errors.neighborhood?.message}>
        <input className={inputClassName} {...form.register('neighborhood')} placeholder="Centro" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rua" error={form.formState.errors.street?.message}>
          <input className={inputClassName} {...form.register('street')} placeholder="Rua Exemplo" />
        </Field>

        <Field label="Número" error={form.formState.errors.number?.message}>
          <input className={inputClassName} {...form.register('number')} placeholder="123" />
        </Field>
      </div>

      <Field label="Complemento" error={form.formState.errors.complement?.message}>
        <input className={inputClassName} {...form.register('complement')} placeholder="Apto, bloco, referência" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="size-4 rounded border-input" {...form.register('isDefault')} />
        Definir como endereço padrão
      </label>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
          {isSubmitting || form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Salvar endereço
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

const inputClassName =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';

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
