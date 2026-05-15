import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function CadastroPage() {
  return (
    <PageContainer className="max-w-lg py-10">
      <PageHeader
        title="Criar conta"
        description="Cadastre-se para solicitar serviços ou atuar como prestador no ResolveJá."
      />
      <RegisterForm />
    </PageContainer>
  );
}
