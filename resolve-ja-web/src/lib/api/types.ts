export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiFailureResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export type ApiFetchOptions = {
  token?: string;
  signal?: AbortSignal;
  body?: unknown;
  headers?: HeadersInit;
};
