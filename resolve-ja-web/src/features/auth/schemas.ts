import { z } from 'zod';

const authRoleSchema = z.enum(['solicitante', 'prestador', 'admin']);
const registerRoleSchema = z.enum(['solicitante', 'prestador']);

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  role: authRoleSchema,
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.'),
    email: z.string().email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula.')
      .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula.')
      .regex(/[0-9]/, 'A senha deve conter ao menos um número.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    role: registerRoleSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
