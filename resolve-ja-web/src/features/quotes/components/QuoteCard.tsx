'use client';

import { Clock3, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { Quote } from '@/features/quotes/types';
import { useAcceptQuote } from '@/features/quotes/hooks';

type QuoteCardProps = {
  quote: Quote;
  requestId: string;
  canAccept?: boolean;
};

export function QuoteCard({ quote, requestId, canAccept = false }: QuoteCardProps) {
  const acceptMutation = useAcceptQuote();

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync({ quoteId: quote.id, requestId });
      toast.success('Orçamento aceito com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor ofertado</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            <MoneyDisplay cents={quote.amount_cents} />
          </p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        {quote.message ? (
          <p className="flex items-start gap-2">
            <FileText className="mt-0.5 size-4" />
            <span>{quote.message}</span>
          </p>
        ) : (
          <p className="text-muted-foreground/80">Prestador não deixou mensagem.</p>
        )}

        {quote.estimated_duration_minutes !== null ? (
          <p className="flex items-center gap-2">
            <Clock3 className="size-4" />
            Duração estimada: {quote.estimated_duration_minutes} min
          </p>
        ) : null}
      </div>

      {canAccept && quote.status === 'sent' ? (
        <div className="mt-4">
          <ConfirmDialog
            title="Aceitar orçamento"
            description="Ao aceitar, esta proposta será definida como escolhida para a solicitação."
            confirmLabel={acceptMutation.isPending ? 'Aceitando...' : 'Aceitar orçamento'}
            onConfirm={() => {
              void handleAccept();
            }}
            trigger={
              <Button className="w-full" disabled={acceptMutation.isPending}>
                Aceitar orçamento
              </Button>
            }
          />
        </div>
      ) : null}
    </article>
  );
}
