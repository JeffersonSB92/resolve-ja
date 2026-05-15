'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks';
import { registerSchema, RegisterFormValues } from '@/features/auth/schemas';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      toast.success('Conta criada com sucesso.');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="register-fullname" className="mb-1 block text-sm font-medium">
          Nome completo
        </label>
        <input
          id="register-fullname"
          type="text"
          autoComplete="name"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('fullName')}
        />
        {form.formState.errors.fullName ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium">
          Senha
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-medium">
          Confirmar senha
        </label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Cadastrando...
          </>
        ) : (
          <>
            <UserPlus className="size-4" />
            Criar conta
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já possui conta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
