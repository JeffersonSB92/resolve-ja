import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { ProviderProfile } from '@/features/providers/types';

type ProviderStatusCardProps = {
  profile: ProviderProfile;
  hasServices: boolean;
};

function statusMessage(status: string): string {
  if (status === 'pending_verification') return 'Seu perfil foi criado e aguarda verificação da equipe.';
  if (status === 'under_review') return 'Estamos analisando seus dados e serviços cadastrados.';
  if (status === 'active') return 'Perfil aprovado. Você já pode receber oportunidades.';
  if (status === 'rejected') return 'Seu perfil foi rejeitado. Revise os dados e tente novamente.';
  if (status === 'suspended') return 'Seu perfil está suspenso temporariamente.';
  return 'Status do perfil atualizado.';
}

export function ProviderStatusCard({ profile, hasServices }: ProviderStatusCardProps) {
  const active = profile.status === 'active';

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Status do onboarding</h2>
          <p className="mt-1 text-sm text-muted-foreground">{statusMessage(profile.status)}</p>
        </div>
        <StatusBadge status={profile.status} />
      </div>

      <div className="space-y-2 rounded-xl border border-border/60 bg-background/70 p-4 text-sm">
        <ChecklistItem done icon={<CheckCircle2 className="size-4 text-emerald-600" />}>
          Perfil criado
        </ChecklistItem>
        <ChecklistItem done={hasServices} icon={<CheckCircle2 className="size-4 text-emerald-600" />}>
          Serviços selecionados
        </ChecklistItem>
        <ChecklistItem
          done={active}
          icon={active ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Clock3 className="size-4 text-amber-600" />}
        >
          Aguardando aprovação
        </ChecklistItem>
      </div>

      {!active ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4" />
          <p>Por segurança, oportunidades só são exibidas após aprovação do perfil.</p>
        </div>
      ) : null}

      {active ? (
        <Button asChild>
          <Link href="/prestador/oportunidades">Ver oportunidades</Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href="/prestador/servicos">Gerenciar serviços</Link>
        </Button>
      )}
    </section>
  );
}

function ChecklistItem({ done, icon, children }: { done: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={done ? 'text-foreground font-medium' : 'text-muted-foreground'}>{children}</span>
    </div>
  );
}
