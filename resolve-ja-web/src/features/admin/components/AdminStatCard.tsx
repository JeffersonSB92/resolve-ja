import { ReactNode } from 'react';

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
};

export function AdminStatCard({ label, value, icon }: AdminStatCardProps) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}
