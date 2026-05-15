'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useCancelRequest } from '@/features/requests/hooks';
import { ServiceRequest } from '@/features/requests/types';

const cancelableStatuses = new Set(['open', 'scheduled', 'provider_arrived', 'awaiting_pin']);

type RequestActionsProps = {
  request: ServiceRequest;
  onEditToggle: () => void;
  isEditing: boolean;
};

export function RequestActions({ request, onEditToggle, isEditing }: RequestActionsProps) {
  const cancelMutation = useCancelRequest();
  const [reason, setReason] = useState('');

  const canEdit = request.status === 'open';
  const canCancel = cancelableStatuses.has(request.status);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: request.id,
        input: { reason: reason.trim() || undefined },
      });
      toast.success('Solicitação cancelada com sucesso.');
      setReason('');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold">Ações</h3>
      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Button variant={isEditing ? 'secondary' : 'outline'} onClick={onEditToggle}>
            {isEditing ? 'Fechar edição' : 'Editar solicitação'}
          </Button>
        ) : null}

        {canCancel ? (
          <ConfirmDialog
            title="Cancelar solicitação"
            description="Deseja realmente cancelar esta solicitação?"
            confirmLabel={cancelMutation.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
            onConfirm={() => {
              void handleCancel();
            }}
            trigger={
              <Button variant="destructive" disabled={cancelMutation.isPending}>
                Cancelar solicitação
              </Button>
            }
          />
        ) : null}
      </div>

      {canCancel ? (
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Motivo do cancelamento (opcional)</label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            placeholder="Descreva brevemente o motivo"
          />
        </div>
      ) : null}
    </section>
  );
}
