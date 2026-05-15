'use client';

import { ChangeEvent, useMemo } from 'react';
import { formatMoneyFromCents } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

type MoneyInputProps = {
  valueCents: number;
  onChangeCents: (value: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? Number(digits) : 0;
}

export function MoneyInput({
  valueCents,
  onChangeCents,
  label = 'Valor',
  disabled,
  className,
}: MoneyInputProps) {
  const displayedValue = useMemo(() => formatMoneyFromCents(valueCents), [valueCents]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeCents(parseCurrencyInput(event.target.value));
  };

  return (
    <label className={cn('block space-y-2', className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayedValue}
        onChange={handleChange}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
