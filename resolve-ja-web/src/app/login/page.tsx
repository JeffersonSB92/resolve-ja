import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <PageContainer className="max-w-lg py-10">
      <PageHeader
        title="Entrar na plataforma"
        description="Acesse sua conta para acompanhar solicitações, atendimentos e gestão da operação."
      />
      <LoginForm />
    </PageContainer>
  );
}
