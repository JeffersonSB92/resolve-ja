'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { PendingProvider } from '@/features/admin/types';
import { useApproveProvider, useRejectProvider, useSuspendProvider } from '@/features/admin/hooks';
import { formatDateTime } from '@/lib/utils/formatters';

type PendingProviderCardProps = {
  provider: PendingProvider;
};

export function PendingProviderCard({ provider }: PendingProviderCardProps) {
  const approveMutation = useApproveProvider();
  const rejectMutation = useRejectProvider();
  const suspendMutation = useSuspendProvider();

  const [reason, setReason] = useState('');

  const approve = async () => {
    try {
      await approveMutation.mutateAsync({ id: provider.id });
      toast.success('Prestador aprovado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const reject = async () => {
    try {
      await rejectMutation.mutateAsync({ id: provider.id, reason: reason || undefined });
      toast.success('Prestador rejeitado.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const suspend = async () => {
    try {
      await suspendMutation.mutateAsync({ id: provider.id, reason: reason || undefined });
      toast.success('Prestador suspenso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  return (
    <article className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {provider.display_name || provider.profiles?.full_name || 'Prestador sem nome'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {provider.base_city || 'Cidade não informada'} - {provider.base_state || 'UF'}
          </p>
        </div>
        <StatusBadge status={provider.status} />
      </div>

      <p className="text-xs text-muted-foreground">
        Criado em {provider.created_at ? formatDateTime(provider.created_at) : 'data indisponível'}
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Motivo (rejeitar/suspender)</label>
        <input
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
          placeholder="Opcional"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          title="Aprovar prestador"
          description="Deseja aprovar este prestador para atuação na plataforma?"
          confirmLabel={approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
          onConfirm={() => {
            void approve();
          }}
          trigger={<Button disabled={approveMutation.isPending}>Aprovar</Button>}
        />

        <ConfirmDialog
          title="Rejeitar prestador"
          description="Deseja rejeitar este prestador?"
          confirmLabel={rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
          onConfirm={() => {
            void reject();
          }}
          trigger={<Button variant="outline" disabled={rejectMutation.isPending}>Rejeitar</Button>}
        />

        <ConfirmDialog
          title="Suspender prestador"
          description="Deseja suspender este prestador?"
          confirmLabel={suspendMutation.isPending ? 'Suspendendo...' : 'Suspender'}
          onConfirm={() => {
            void suspend();
          }}
          trigger={<Button variant="destructive" disabled={suspendMutation.isPending}>Suspender</Button>}
        />
      </div>
    </article>
  );
}
