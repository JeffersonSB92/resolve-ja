import { formatMoneyFromCents } from '@/lib/utils/formatters';

type MoneyDisplayProps = {
  cents: number;
  className?: string;
};

export function MoneyDisplay({ cents, className }: MoneyDisplayProps) {
  return <span className={className}>{formatMoneyFromCents(cents)}</span>;
}
