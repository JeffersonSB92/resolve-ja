export type DomainStatus =
  | 'open'
  | 'scheduled'
  | 'in_progress'
  | 'provider_arrived'
  | 'awaiting_pin'
  | 'pending_confirmation'
  | 'completed'
  | 'canceled'
  | 'disputed'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired'
  | 'pending_verification'
  | 'under_review'
  | 'active'
  | 'suspended';

export type StatusVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

type StatusMeta = {
  label: string;
  variant: StatusVariant;
};

const statusMap: Record<DomainStatus, StatusMeta> = {
  open: { label: 'Aberto', variant: 'info' },
  scheduled: { label: 'Agendado', variant: 'warning' },
  in_progress: { label: 'Em andamento', variant: 'warning' },
  provider_arrived: { label: 'Prestador chegou', variant: 'info' },
  awaiting_pin: { label: 'Aguardando PIN', variant: 'warning' },
  pending_confirmation: { label: 'Aguardando confirmação', variant: 'warning' },
  completed: { label: 'Concluído', variant: 'success' },
  canceled: { label: 'Cancelado', variant: 'danger' },
  disputed: { label: 'Em disputa', variant: 'danger' },
  sent: { label: 'Enviada', variant: 'info' },
  accepted: { label: 'Aceita', variant: 'success' },
  rejected: { label: 'Recusada', variant: 'danger' },
  withdrawn: { label: 'Retirada', variant: 'neutral' },
  expired: { label: 'Expirada', variant: 'neutral' },
  pending_verification: { label: 'Aguardando verificação', variant: 'warning' },
  under_review: { label: 'Em análise', variant: 'warning' },
  active: { label: 'Ativo', variant: 'success' },
  suspended: { label: 'Suspenso', variant: 'danger' },
};

export function getStatusMeta(status: string): StatusMeta {
  if (status in statusMap) {
    return statusMap[status as DomainStatus];
  }

  return {
    label: status.replaceAll('_', ' '),
    variant: 'neutral',
  };
}
