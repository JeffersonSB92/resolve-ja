'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { useAddresses } from '@/features/addresses/hooks';
import { useServices } from '@/features/catalog/hooks';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useCreateRequest, useUpdateRequest } from '@/features/requests/hooks';
import { RequestFormValues, requestFormSchema } from '@/features/requests/schemas';
import { ServiceRequest } from '@/features/requests/types';

type RequestFormProps = {
  mode: 'create' | 'edit';
  request?: ServiceRequest;
};

function toDatetimeLocalValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

function toIsoOrUndefined(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function RequestForm({ mode, request }: RequestFormProps) {
  const router = useRouter();
  const servicesQuery = useServices();
  const addressesQuery = useAddresses();
  const createMutation = useCreateRequest();
  const updateMutation = useUpdateRequest();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      serviceId: request?.service_id ?? '',
      addressId: request?.address_id ?? '',
      title: request?.title ?? '',
      description: request?.description ?? undefined,
      desiredStartAt: toDatetimeLocalValue(request?.desired_start_at),
      desiredEndAt: toDatetimeLocalValue(request?.desired_end_at),
      budgetCents: request?.budget_cents ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      serviceId: request?.service_id ?? '',
      addressId: request?.address_id ?? '',
      title: request?.title ?? '',
      description: request?.description ?? undefined,
      desiredStartAt: toDatetimeLocalValue(request?.desired_start_at),
      desiredEndAt: toDatetimeLocalValue(request?.desired_end_at),
      budgetCents: request?.budget_cents ?? undefined,
    });
  }, [form, request]);

  if (addressesQuery.data && addressesQuery.data.length === 0) {
    return (
      <EmptyState
        title="Você ainda não possui endereços"
        description="Para abrir uma solicitação, primeiro adicione ao menos um endereço."
        action={
          <Button asChild>
            <Link href="/solicitante/enderecos">Ir para endereços</Link>
          </Button>
        }
      />
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        serviceId: values.serviceId,
        addressId: values.addressId,
        title: values.title,
        description: values.description ?? undefined,
        desiredStartAt: toIsoOrUndefined(values.desiredStartAt),
        desiredEndAt: toIsoOrUndefined(values.desiredEndAt),
        budgetCents: values.budgetCents,
      };

      if (mode === 'create') {
        const created = await createMutation.mutateAsync(payload);
        toast.success('Solicitação criada com sucesso.');
        router.replace(`/solicitante/solicitacoes/${created.id}`);
        return;
      }

      if (!request) {
        toast.error('Solicitação não encontrada para edição.');
        return;
      }

      const updated = await updateMutation.mutateAsync({
        id: request.id,
        input: {
          title: payload.title,
          description: payload.description,
          desiredStartAt: payload.desiredStartAt,
          desiredEndAt: payload.desiredEndAt,
          budgetCents: payload.budgetCents,
        },
      });

      toast.success('Solicitação atualizada com sucesso.');
      router.replace(`/solicitante/solicitacoes/${updated.id}`);
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Serviço" error={form.formState.errors.serviceId?.message}>
          <select className={inputClassName} {...form.register('serviceId')}>
            <option value="">Selecione um serviço</option>
            {(servicesQuery.data ?? []).map((service) => (
              <option key={service.id} value={service.id}>
                {service.name ?? 'Serviço'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Endereço" error={form.formState.errors.addressId?.message}>
          <select className={inputClassName} {...form.register('addressId')}>
            <option value="">Selecione um endereço</option>
            {(addressesQuery.data ?? []).map((address) => (
              <option key={address.id} value={address.id}>
                {(address.label || address.street) + ` - ${address.city}/${address.state}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Título" error={form.formState.errors.title?.message}>
        <input className={inputClassName} {...form.register('title')} placeholder="Ex.: Instalação de chuveiro" />
      </Field>

      <Field label="Descrição" error={form.formState.errors.description?.message}>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          rows={4}
          {...form.register('description')}
          placeholder="Descreva o que precisa ser feito"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início desejado" error={form.formState.errors.desiredStartAt?.message}>
          <input type="datetime-local" className={inputClassName} {...form.register('desiredStartAt')} />
        </Field>

        <Field label="Fim desejado" error={form.formState.errors.desiredEndAt?.message}>
          <input type="datetime-local" className={inputClassName} {...form.register('desiredEndAt')} />
        </Field>
      </div>

      <Field label="Orçamento (centavos)" error={form.formState.errors.budgetCents?.message}>
        <Controller
          control={form.control}
          name="budgetCents"
          render={({ field }) => (
            <input
              type="number"
              min={0}
              className={inputClassName}
              value={field.value ?? ''}
              onChange={(event) => {
                const next = event.target.value;
                field.onChange(next === '' ? undefined : Number(next));
              }}
              placeholder="Ex.: 15000"
            />
          )}
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              {mode === 'create' ? 'Criar solicitação' : 'Salvar alterações'}
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
