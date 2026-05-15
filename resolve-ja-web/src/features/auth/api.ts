import { getApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/api-error';
import { MeResponse } from '@/features/auth/types';

export async function getMe(token: string): Promise<MeResponse> {
  return getApi<MeResponse>('/me', { token });
}

export function mapAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }

    if (error.statusCode >= 500) {
      return 'A API está indisponível no momento. Tente novamente em instantes.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível concluir a operação.';
}
