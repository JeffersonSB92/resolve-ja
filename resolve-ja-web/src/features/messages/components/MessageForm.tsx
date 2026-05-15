'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, SendHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { MessageFormValues, messageFormSchema } from '@/features/messages/schemas';

type MessageFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: MessageFormValues) => Promise<void>;
};

export function MessageForm({ isSubmitting = false, onSubmit }: MessageFormProps) {
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      body: '',
      attachmentPath: undefined,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset({ body: '', attachmentPath: undefined });
  });

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-border/70 bg-card/90 p-3 sm:p-4">
      <textarea
        rows={2}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        placeholder="Digite sua mensagem..."
        {...form.register('body')}
      />
      {form.formState.errors.body ? (
        <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
      ) : null}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Anexo (opcional)</summary>
        <input
          className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          placeholder="caminho/do/arquivo.jpg"
          {...form.register('attachmentPath')}
        />
      </details>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
          {isSubmitting || form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
