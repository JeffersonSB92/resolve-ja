import Link from 'next/link';
import { ClipboardPlus, MapPinHouse } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequestList } from '@/features/requests/components/RequestList';
import { Button } from '@/components/ui/button';

export default function SolicitantePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Área do solicitante"
        description="Crie novas solicitações e acompanhe o andamento dos atendimentos."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/solicitante/enderecos">
                <MapPinHouse className="size-4" />
                Endereços
              </Link>
            </Button>
            <Button asChild>
              <Link href="/solicitante/solicitacoes/nova">
                <ClipboardPlus className="size-4" />
                Nova solicitação
              </Link>
            </Button>
          </div>
        }
      />

      <RequestList compact />
    </PageContainer>
  );
}
