import { RequestMessage } from '@/features/messages/types';
import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '@/lib/utils/formatters';

type MessageBubbleProps = {
  message: RequestMessage;
  isMine: boolean;
};

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <article className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
          isMine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border/70 bg-background text-foreground',
        )}
      >
        {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}

        {message.attachment_path ? (
          <p className={cn('mt-1 break-all text-xs', isMine ? 'text-primary-foreground/85' : 'text-muted-foreground')}>
            Anexo: {message.attachment_path}
          </p>
        ) : null}

        <p className={cn('mt-2 text-[11px]', isMine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          {formatDateTime(message.created_at)}
        </p>
      </div>
    </article>
  );
}
