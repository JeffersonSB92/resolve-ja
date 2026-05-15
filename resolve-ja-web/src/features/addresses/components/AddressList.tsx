'use client';

import { Home, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { AddressCard } from '@/features/addresses/components/AddressCard';
import { AddressForm } from '@/features/addresses/components/AddressForm';
import { AddressFormValues } from '@/features/addresses/schemas';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '@/features/addresses/hooks';
import { Address } from '@/features/addresses/types';

type ModalMode = 'create' | 'edit';

export function AddressList() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();

  const [isModalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const deletingId = useMemo(() => {
    if (!deleteMutation.isPending) {
      return null;
    }

    return deleteMutation.variables ?? null;
  }, [deleteMutation.isPending, deleteMutation.variables]);

  const openCreate = () => {
    setMode('create');
    setEditingAddress(null);
    setModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setMode('edit');
    setEditingAddress(address);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    setModalOpen(false);
  };

  const handleSubmit = async (values: AddressFormValues) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(values);
        toast.success('Endereço criado com sucesso.');
      } else if (editingAddress) {
        await updateMutation.mutateAsync({ id: editingAddress.id, input: values });
        toast.success('Endereço atualizado com sucesso.');
      }

      setModalOpen(false);
    } catch (submitError) {
      toast.error(mapAuthErrorMessage(submitError));
    }
  };

  const handleDelete = async (address: Address) => {
    try {
      await deleteMutation.mutateAsync(address.id);
      toast.success('Endereço removido com sucesso.');
    } catch (deleteError) {
      toast.error(mapAuthErrorMessage(deleteError));
    }
  };

  if (isLoading) {
    return <LoadingState lines={4} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={mapAuthErrorMessage(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const addresses = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Seus endereços</h2>
        <Button onClick={openCreate} disabled={isFetching}>
          <Plus className="size-4" />
          Novo endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Nenhum endereço cadastrado"
          description="Adicione seu primeiro endereço para facilitar a criação de solicitações."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Adicionar endereço
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={openEdit}
              onDelete={handleDelete}
              isDeleting={deletingId === address.id}
            />
          ))}
        </div>
      )}

      {isModalOpen ? (
        <AddressModal
          mode={mode}
          initialData={editingAddress}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

type AddressModalProps = {
  mode: ModalMode;
  initialData: Address | null;
  isSubmitting: boolean;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  onClose: () => void;
};

function AddressModal({ mode, initialData, isSubmitting, onSubmit, onClose }: AddressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar" />
      <section className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/70 bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">
              {mode === 'create' ? 'Novo endereço' : 'Editar endereço'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Preencha os dados do endereço para usar em novas solicitações.'
                : 'Atualize as informações do endereço selecionado.'}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <AddressForm
          initialData={initialData}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </section>
    </div>
  );
}
