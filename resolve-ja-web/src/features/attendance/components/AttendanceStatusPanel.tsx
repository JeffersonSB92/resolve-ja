import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ServiceRequest } from '@/features/requests/types';

type AttendanceStatusPanelProps = {
  request: ServiceRequest;
};

export function AttendanceStatusPanel({ request }: AttendanceStatusPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Status operacional</h3>
        <StatusBadge status={request.status} />
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4" />
          Nunca compartilhe PIN fora do aplicativo. Confirme a identidade antes de validar início.
        </p>
      </div>

      {(request.status === 'pending_confirmation' || request.status === 'provider_arrived') ? (
        <div className="rounded-xl border border-sky-300 bg-sky-50 p-3 text-sm text-sky-800">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4" />
            Atenção ao fluxo operacional para evitar contestação de atendimento.
          </p>
        </div>
      ) : null}
    </section>
  );
}
