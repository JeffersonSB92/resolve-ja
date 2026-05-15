'use client';

import { Clock3, FileText, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useAcceptQuote, useWithdrawQuote } from '@/features/quotes/hooks';
import { Quote } from '@/features/quotes/types';

type QuoteCardProps = {
  quote: Quote;
  requestId: string;
  canAccept?: boolean;
  canWithdraw?: boolean;
};

export function QuoteCard({
  quote,
  requestId,
  canAccept = false,
  canWithdraw = false,
}: QuoteCardProps) {
  const acceptMutation = useAcceptQuote();
  const withdrawMutation = useWithdrawQuote();

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync({ quoteId: quote.id, requestId });
      toast.success('Orçamento aceito com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawMutation.mutateAsync({ quoteId: quote.id, requestId });
      toast.success('Orçamento retirado com sucesso.');
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

      <div className="mt-4 flex flex-wrap gap-2">
        {canAccept && quote.status === 'sent' ? (
          <ConfirmDialog
            title="Aceitar orçamento"
            description="Ao aceitar, esta proposta será definida como escolhida para a solicitação."
            confirmLabel={acceptMutation.isPending ? 'Aceitando...' : 'Aceitar orçamento'}
            onConfirm={() => {
              void handleAccept();
            }}
            trigger={
              <Button className="w-full sm:w-auto" disabled={acceptMutation.isPending}>
                Aceitar orçamento
              </Button>
            }
          />
        ) : null}

        {canWithdraw && quote.status === 'sent' ? (
          <ConfirmDialog
            title="Retirar orçamento"
            description="Deseja retirar este orçamento da solicitação?"
            confirmLabel={withdrawMutation.isPending ? 'Retirando...' : 'Retirar orçamento'}
            onConfirm={() => {
              void handleWithdraw();
            }}
            trigger={
              <Button variant="outline" className="w-full sm:w-auto" disabled={withdrawMutation.isPending}>
                <Undo2 className="size-4" />
                Retirar orçamento
              </Button>
            }
          />
        ) : null}
      </div>
    </article>
  );
}
