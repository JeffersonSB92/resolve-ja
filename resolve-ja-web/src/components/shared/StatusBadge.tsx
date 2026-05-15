import { cn } from '@/lib/utils/cn';
import { getStatusMeta } from '@/lib/utils/status-labels';

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const variantClasses = {
  neutral: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  info: 'border-sky-200 bg-sky-100 text-sky-700',
  warning: 'border-amber-200 bg-amber-100 text-amber-700',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  danger: 'border-rose-200 bg-rose-100 text-rose-700',
} as const;

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        variantClasses[meta.variant],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
