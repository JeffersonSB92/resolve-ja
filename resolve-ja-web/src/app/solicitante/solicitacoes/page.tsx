import Link from 'next/link';
import { ClipboardPlus } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequestList } from '@/features/requests/components/RequestList';
import { Button } from '@/components/ui/button';

export default function SolicitacoesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Minhas solicitações"
        description="Filtre e acompanhe cada solicitação em tempo real."
        action={
          <Button asChild>
            <Link href="/solicitante/solicitacoes/nova">
              <ClipboardPlus className="size-4" />
              Nova solicitação
            </Link>
          </Button>
        }
      />

      <RequestList />
    </PageContainer>
  );
}
