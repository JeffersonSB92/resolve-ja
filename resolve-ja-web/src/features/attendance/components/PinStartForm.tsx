'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PinStartFormValues, pinStartSchema } from '@/features/attendance/schemas';

type PinStartFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: PinStartFormValues) => Promise<void>;
};

export function PinStartForm({ isSubmitting = false, onSubmit }: PinStartFormProps) {
  const form = useForm<PinStartFormValues>({
    resolver: zodResolver(pinStartSchema),
    defaultValues: { pin: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Iniciar serviço com PIN</h3>
      <p className="text-sm text-muted-foreground">
        Solicite o PIN ao cliente e confirme antes de iniciar o atendimento.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">PIN</label>
        <input
          className={inputClassName}
          placeholder="Digite o PIN informado pelo cliente"
          {...form.register('pin')}
        />
        {form.formState.errors.pin ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.pin.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || form.formState.isSubmitting}>
        {isSubmitting || form.formState.isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Validando PIN...
          </>
        ) : (
          <>
            <KeyRound className="size-4" />
            Iniciar atendimento
          </>
        )}
      </Button>
    </form>
  );
}

const inputClassName =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';
