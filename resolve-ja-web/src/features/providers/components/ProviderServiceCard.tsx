'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { Service } from '@/features/catalog/types';
import { useDeleteProviderServiceMe, useUpdateProviderServiceMe } from '@/features/providers/hooks';
import { ProviderService } from '@/features/providers/types';

type ProviderServiceCardProps = {
  item: ProviderService;
  service?: Service;
};

export function ProviderServiceCard({ item, service }: ProviderServiceCardProps) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(item.base_price_cents?.toString() ?? '');
  const [notes, setNotes] = useState(item.price_notes ?? '');

  const deleteMutation = useDeleteProviderServiceMe();
  const updateMutation = useUpdateProviderServiceMe();

  const save = async () => {
    try {
      await updateMutation.mutateAsync({
        serviceId: item.service_id,
        input: {
          basePriceCents: price.trim().length > 0 ? Number(price) : null,
          priceNotes: notes.trim().length > 0 ? notes : null,
        },
      });
      toast.success('Serviço atualizado.');
      setEditing(false);
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  const remove = async () => {
    try {
      await deleteMutation.mutateAsync(item.service_id);
      toast.success('Serviço removido com sucesso.');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  };

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{service?.name ?? 'Serviço vinculado'}</h3>
          <p className="text-sm text-muted-foreground">{service?.description ?? 'Descrição indisponível.'}</p>
        </div>
        <StatusBadge status={item.active ? 'active' : 'suspended'} />
      </div>

      {!editing ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Preço base:{' '}
            {item.base_price_cents !== null ? (
              <MoneyDisplay cents={item.base_price_cents} className="font-medium text-foreground" />
            ) : (
              'Não informado'
            )}
          </p>
          <p>Observações: {item.price_notes || 'Sem observações'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="number"
            min={0}
            className={inputClassName}
            value={price}
            onChange={(event) => {
              setPrice(event.target.value);
            }}
            placeholder="Preço base em centavos"
          />
          <input
            className={inputClassName}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            placeholder="Observações de preço"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={() => void save()} disabled={updateMutation.isPending}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Editar
          </Button>
        )}

        <ConfirmDialog
          title="Remover serviço"
          description="Deseja remover este serviço da sua oferta?"
          confirmLabel={deleteMutation.isPending ? 'Removendo...' : 'Remover'}
          onConfirm={() => {
            void remove();
          }}
          trigger={
            <Button size="sm" variant="destructive" disabled={deleteMutation.isPending}>
              <Trash2 className="size-4" />
              Remover
            </Button>
          }
        />
      </div>
    </article>
  );
}

const inputClassName =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40';
