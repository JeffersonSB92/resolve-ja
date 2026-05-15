import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdminRequest } from '@/features/admin/types';
import { formatDateTime } from '@/lib/utils/formatters';

type AdminRequestTableProps = {
  requests: AdminRequest[];
};

export function AdminRequestTable({ requests }: AdminRequestTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item.id} className="border-t border-border/60">
                <td className="px-4 py-3">{item.title || 'Sem título'}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status || 'unknown'} /></td>
                <td className="px-4 py-3">{item.location_city || '—'}</td>
                <td className="px-4 py-3">
                  {item.requester_name || item.requester_profile?.full_name || item.requester_id || '—'}
                </td>
                <td className="px-4 py-3">{item.created_at ? formatDateTime(item.created_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
