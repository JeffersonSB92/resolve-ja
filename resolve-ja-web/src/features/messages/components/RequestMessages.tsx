'use client';

import { MessageCircleMore } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import { MessageBubble } from '@/features/messages/components/MessageBubble';
import { MessageForm } from '@/features/messages/components/MessageForm';
import { useCreateRequestMessage, useRequestMessages } from '@/features/messages/hooks';
import { MessageFormValues } from '@/features/messages/schemas';

type RequestMessagesProps = {
  requestId: string;
};

export function RequestMessages({ requestId }: RequestMessagesProps) {
  const { me } = useAuth();
  const messagesQuery = useRequestMessages(requestId);
  const createMutation = useCreateRequestMessage();

  const handleSubmit = async (values: MessageFormValues) => {
    try {
      await createMutation.mutateAsync({
        requestId,
        input: {
          body: values.body,
          attachmentPath: values.attachmentPath,
        },
      });
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
      throw error;
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <header className="border-b border-border/70 px-4 py-3">
        <h3 className="text-base font-semibold">Mensagens</h3>
      </header>

      <div className="max-h-[360px] overflow-y-auto p-4 sm:max-h-[420px]">
        {messagesQuery.isLoading ? (
          <LoadingState lines={3} className="border-none bg-transparent p-0 shadow-none" />
        ) : messagesQuery.isError ? (
          <ErrorState
            message={mapAuthErrorMessage(messagesQuery.error)}
            onRetry={() => {
              void messagesQuery.refetch();
            }}
            className="bg-transparent"
          />
        ) : (messagesQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={MessageCircleMore}
            title="Sem mensagens ainda"
            description="Inicie a conversa para combinar os detalhes do atendimento."
            className="border-none bg-transparent p-2 shadow-none"
          />
        ) : (
          <div className="space-y-3">
            {(messagesQuery.data ?? []).map((message) => (
              <MessageBubble key={message.id} message={message} isMine={message.sender_id === me?.userId} />
            ))}
          </div>
        )}
      </div>

      <MessageForm isSubmitting={createMutation.isPending} onSubmit={handleSubmit} />
    </section>
  );
}
