'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks';
import { LoginFormValues, loginSchema } from '@/features/auth/schemas';
import { mapAuthErrorMessage } from '@/features/auth/api';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'solicitante',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn({
        email: values.email,
        password: values.password,
        role: values.role,
      });
      toast.success('Login realizado com sucesso.');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(mapAuthErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="login-role" className="mb-1 block text-sm font-medium">
          Entrar como
        </label>
        <select
          id="login-role"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('role')}
        >
          <option value="solicitante">Solicitante</option>
          <option value="prestador">Prestador</option>
          <option value="admin">Admin</option>
        </select>
        {form.formState.errors.role ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.role.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="mb-1 block text-sm font-medium">
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            Entrar
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Criar cadastro
        </Link>
      </p>
    </form>
  );
}
