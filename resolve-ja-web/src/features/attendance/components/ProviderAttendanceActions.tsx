'use client';

import { CheckCircle2, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { CheckInForm } from '@/features/attendance/components/CheckInForm';
import { PinStartForm } from '@/features/attendance/components/PinStartForm';
import {
  useCheckInRequest,
  useMarkServiceDone,
  useStartRequest,
} from '@/features/attendance/hooks';
import { CheckInFormValues, PinStartFormValues } from '@/features/attendance/schemas';
import { ServiceRequest } from '@/features/requests/types';

type ProviderAttendanceActionsProps = {
  request: ServiceRequest;
};

export function ProviderAttendanceActions({ request }: ProviderAttendanceActionsProps) {
  const checkInMutation = useCheckInRequest();
  const startMutation = useStartRequest();
  const markDoneMutation = useMarkServiceDone();

  const handleCheckIn = async (values: CheckInFormValues) => {
    try {
      await checkInMutation.mutateAsync({
        requestId: request.id,
        input: {
          selfiePath: values.selfiePath,
          lat: values.lat,
          lng: values.lng,
        },
      });
      toast.success('Check-in realizado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const handleStart = async (values: PinStartFormValues) => {
    try {
      await startMutation.mutateAsync({
        requestId: request.id,
        input: { pin: values.pin },
      });
      toast.success('Atendimento iniciado com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const handleMarkDone = async () => {
    try {
      await markDoneMutation.mutateAsync({ requestId: request.id });
      toast.success('Atendimento marcado como feito.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  if (request.status === 'scheduled') {
    return <CheckInForm isSubmitting={checkInMutation.isPending} onSubmit={handleCheckIn} />;
  }

  if (request.status === 'awaiting_pin' || request.status === 'provider_arrived') {
    return <PinStartForm isSubmitting={startMutation.isPending} onSubmit={handleStart} />;
  }

  if (request.status === 'in_progress') {
    return (
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Concluir execução</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando finalizar o serviço, marque como feito para o cliente confirmar a conclusão.
        </p>
        <Button className="mt-4" onClick={() => void handleMarkDone()} disabled={markDoneMutation.isPending}>
          <CheckCircle2 className="size-4" />
          {markDoneMutation.isPending ? 'Marcando...' : 'Marcar como feito'}
        </Button>
      </section>
    );
  }

  if (request.status === 'pending_confirmation') {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900">
          <Clock3 className="size-4" />
          Aguardando confirmação do cliente
        </h3>
        <p className="mt-1 text-sm text-amber-800">
          O serviço foi concluído e está aguardando a confirmação final do solicitante.
        </p>
      </section>
    );
  }

  if (request.status === 'completed') {
    return (
      <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-emerald-900">Atendimento concluído</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Este atendimento já foi finalizado e confirmado pelo cliente.
        </p>
      </section>
    );
  }

  return <ErrorState title="Sem ações disponíveis" message="Não há ações operacionais para o status atual." />;
}
