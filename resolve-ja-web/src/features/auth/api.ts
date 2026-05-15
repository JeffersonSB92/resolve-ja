import { getApi } from '@/lib/api/client';
import { ApiError } from '@/lib/api/api-error';
import { MeResponse } from '@/features/auth/types';

export async function getMe(token: string): Promise<MeResponse> {
  return getApi<MeResponse>('/me', { token });
}

export function mapAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 0 || error.code === 'NETWORK_ERROR') {
      return 'A API está indisponível no momento. Verifique se o backend está rodando.';
    }

    if (error.statusCode === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }

    if (error.statusCode >= 500) {
      if (process.env.NODE_ENV !== 'production') {
        return `Erro interno da API (${error.code}): ${error.message}`;
      }

      return 'A API está indisponível no momento. Tente novamente em instantes.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível concluir a operação.';
}
