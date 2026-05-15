'use client';

import { ReactNode, useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <span
        className="inline-flex cursor-pointer"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        {trigger}
      </span>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => {
              setIsOpen(false);
            }}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                {cancelLabel}
              </Button>
            <Button
              onClick={() => {
                setIsOpen(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
