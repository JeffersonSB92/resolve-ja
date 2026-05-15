import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdminReport } from '@/features/admin/types';
import { formatDateTime } from '@/lib/utils/formatters';

type AdminReportTableProps = {
  reports: AdminReport[];
};

export function AdminReportTable({ reports }: AdminReportTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Solicitação</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((item) => (
              <tr key={item.id} className="border-t border-border/60">
                <td className="px-4 py-3">{item.type || item.reason || 'Denúncia'}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status || 'open'} /></td>
                <td className="px-4 py-3 font-mono text-xs">{item.request_id || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.reporter_id || '—'}</td>
                <td className="px-4 py-3">{item.created_at ? formatDateTime(item.created_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
