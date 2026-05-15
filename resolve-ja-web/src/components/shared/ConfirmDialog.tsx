'use client';

import { ReactNode, useId } from 'react';
import { Button } from '@/components/ui/button';

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  trigger: ReactNode;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const dialogId = useId();

  return (
    <>
      <label htmlFor={dialogId} className="inline-flex cursor-pointer">
        {trigger}
      </label>
      <input id={dialogId} type="checkbox" className="peer sr-only" />
      <div className="fixed inset-0 z-50 hidden bg-black/40 peer-checked:block" />
      <div className="fixed left-1/2 top-1/2 z-50 hidden w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl peer-checked:block">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <label htmlFor={dialogId}>
            <Button variant="outline">{cancelLabel}</Button>
          </label>
          <label htmlFor={dialogId}>
            <Button
              onClick={() => {
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </label>
        </div>
      </div>
    </>
  );
}
