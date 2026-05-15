'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CheckInFormValues, checkInSchema } from '@/features/attendance/schemas';

type CheckInFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: CheckInFormValues) => Promise<void>;
};

export function CheckInForm({ isSubmitting = false, onSubmit }: CheckInFormProps) {
  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: { selfiePath: '', lat: undefined, lng: undefined },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Check-in do atendimento</h3>
      <p className="text-sm text-muted-foreground">
        Por enquanto, use um caminho de selfie simulado. Em breve este passo terá upload real com validação.
      </p>

      <Field label="Selfie (caminho simulado)" error={form.formState.errors.selfiePath?.message}>
        <input className={inputClassName} placeholder="uploads/selfie-atendimento.jpg" {...form.register('selfiePath')} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude (opcional)" error={form.formState.errors.lat?.message}>
          <input type="number" step="any" className={inputClassName} {...form.register('lat', { valueAsNumber: true })} />
        </Field>
        <Field label="Longitude (opcional)" error={form.formState.errors.lng?.message}>
          <input type="number" step="any" className={inputClassName} {...form.register('lng', { valueAsNumber: true })} />
        </Field>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || form.formState.isSubmitting}>
        {isSubmitting || form.formState.isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Enviando check-in...
          </>
        ) : (
          <>
            <Camera className="size-4" />
            Confirmar check-in
          </>
        )}
      </Button>
    </form>
  );
}

type FieldProps = { label: string; error?: string; children: React.ReactNode };

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
