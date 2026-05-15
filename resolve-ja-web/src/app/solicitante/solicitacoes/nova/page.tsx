import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequestForm } from '@/features/requests/components/RequestForm';

export default function NovaSolicitacaoPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Nova solicitação"
        description="Defina serviço, local e detalhes para receber propostas de prestadores."
      />

      <RequestForm mode="create" />
    </PageContainer>
  );
}
