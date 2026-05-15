import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AddressList } from '@/features/addresses/components/AddressList';

export default function SolicitanteEnderecosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Endereços"
        description="Gerencie os locais onde seus serviços podem ser atendidos."
      />
      <AddressList />
    </PageContainer>
  );
}
