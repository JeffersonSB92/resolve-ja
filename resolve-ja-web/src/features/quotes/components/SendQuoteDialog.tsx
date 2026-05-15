'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { sendQuoteSchema, SendQuoteFormValues } from '@/features/quotes/schemas';
import { useSendQuote } from '@/features/quotes/hooks';

type SendQuoteDialogProps = {
  requestId: string;
};

export function SendQuoteDialog({ requestId }: SendQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const sendQuoteMutation = useSendQuote();

  const form = useForm<SendQuoteFormValues>({
    resolver: zodResolver(sendQuoteSchema),
    defaultValues: {
      amountCents: undefined,
      estimatedDurationMinutes: undefined,
      message: undefined,
      validUntil: undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await sendQuoteMutation.mutateAsync({
        requestId,
        input: {
          amountCents: values.amountCents,
          estimatedDurationMinutes: values.estimatedDurationMinutes,
          message: values.message,
          validUntil: values.validUntil ? new Date(values.validUntil).toISOString() : undefined,
        },
      });

      toast.success('Orçamento enviado com sucesso.');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Send className="size-4" />
        Enviar orçamento
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Fechar diálogo"
          />

          <section className="relative z-10 w-full max-w-xl rounded-2xl border border-border/70 bg-background p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Enviar orçamento</h3>
              <p className="text-sm text-muted-foreground">Defina valor, prazo e observações da proposta.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Valor (centavos)" error={form.formState.errors.amountCents?.message}>
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  {...form.register('amountCents', { valueAsNumber: true })}
                />
              </Field>

              <Field
                label="Duração estimada (minutos)"
                error={form.formState.errors.estimatedDurationMinutes?.message}
              >
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  {...form.register('estimatedDurationMinutes', { valueAsNumber: true })}
                />
              </Field>

              <Field label="Mensagem" error={form.formState.errors.message?.message}>
                <textarea rows={4} className={textareaClassName} {...form.register('message')} />
              </Field>

              <Field label="Válido até" error={form.formState.errors.validUntil?.message}>
                <input type="datetime-local" className={inputClassName} {...form.register('validUntil')} />
              </Field>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendQuoteMutation.isPending}>
                  {sendQuoteMutation.isPending ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Confirmar envio
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
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
