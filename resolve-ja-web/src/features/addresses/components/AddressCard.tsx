'use client';

import { MapPinned, Pencil, Star, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Address } from '@/features/addresses/types';

type AddressCardProps = {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  isDeleting?: boolean;
};

function formatAddressLine(address: Address): string {
  const number = address.number ? `, ${address.number}` : '';
  const neighborhood = address.neighborhood ? ` - ${address.neighborhood}` : '';
  return `${address.street}${number}${neighborhood}`;
}

export function AddressCard({ address, onEdit, onDelete, isDeleting = false }: AddressCardProps) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{address.label || 'Endereço'}</h3>
            {address.is_default ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <Star className="size-3" />
                Padrão
              </span>
            ) : null}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinned className="size-4" />
            <span className="truncate">{formatAddressLine(address)}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {address.city} - {address.state}
          </p>
          {address.postal_code ? <p className="mt-1 text-xs text-muted-foreground">CEP: {address.postal_code}</p> : null}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(address)} title="Editar endereço">
            <Pencil className="size-4" />
          </Button>

          <ConfirmDialog
            title="Excluir endereço"
            description="Essa ação não pode ser desfeita. Tem certeza de que deseja excluir este endereço?"
            confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'}
            onConfirm={() => onDelete(address)}
            trigger={
              <Button variant="ghost" size="icon-sm" disabled={isDeleting} title="Excluir endereço">
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
    </article>
  );
}
