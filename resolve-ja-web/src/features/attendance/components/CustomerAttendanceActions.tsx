'use client';

import { KeyRound, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useConfirmServiceCompletion, useGeneratePin } from '@/features/attendance/hooks';
import { ServiceRequest } from '@/features/requests/types';

type CustomerAttendanceActionsProps = {
  request: ServiceRequest;
};

export function CustomerAttendanceActions({ request }: CustomerAttendanceActionsProps) {
  const generatePinMutation = useGeneratePin();
  const confirmMutation = useConfirmServiceCompletion();
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  const canGeneratePin = request.status === 'scheduled' || request.status === 'provider_arrived';
  const canConfirm = request.status === 'pending_confirmation' || request.status === 'in_progress';

  const handleGeneratePin = async () => {
    try {
      const result = await generatePinMutation.mutateAsync({ requestId: request.id });
      setGeneratedPin(result.pin.pin);
      toast.success('PIN gerado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      await confirmMutation.mutateAsync({ requestId: request.id });
      toast.success('Conclusão confirmada com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  if (!canGeneratePin && !canConfirm && !generatedPin) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Ações do solicitante</h3>

      {canGeneratePin ? (
        <Button onClick={() => void handleGeneratePin()} disabled={generatePinMutation.isPending}>
          <KeyRound className="size-4" />
          {generatePinMutation.isPending ? 'Gerando PIN...' : 'Gerar PIN'}
        </Button>
      ) : null}

      {generatedPin ? (
        <div className="space-y-3 rounded-xl border border-sky-300 bg-sky-50 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-sky-800">PIN de início</p>
            <p className="text-3xl font-bold tracking-[0.25em] text-sky-900">{generatedPin}</p>
          </div>
          <p className="flex items-start gap-2 text-sm text-sky-900">
            <ShieldAlert className="mt-0.5 size-4" />
            Informe este código somente se o prestador for a pessoa exibida no aplicativo.
          </p>
        </div>
      ) : null}

      {canConfirm ? (
        <Button variant="secondary" onClick={() => void handleConfirmCompletion()} disabled={confirmMutation.isPending}>
          {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar conclusão'}
        </Button>
      ) : null}
    </section>
  );
}
