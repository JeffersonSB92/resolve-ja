import { PageContainer } from '@/components/layout/PageContainer';
import { RequestDetails } from '@/features/requests/components/RequestDetails';

type SolicitacaoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SolicitacaoDetalhePage({ params }: SolicitacaoDetalhePageProps) {
  const { id } = await params;

  return (
    <PageContainer className="max-w-5xl">
      <RequestDetails requestId={id} />
    </PageContainer>
  );
}
