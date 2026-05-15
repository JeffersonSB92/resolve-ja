export const queryKeys = {
  me: ['me'] as const,
  catalog: {
    categories: ['catalog', 'categories'] as const,
    services: (categoryId?: string) => ['catalog', 'services', categoryId ?? 'all'] as const,
  },
  addresses: ['addresses'] as const,
  requests: {
    mine: (status?: string) => ['requests', 'mine', status ?? 'all'] as const,
    detail: (requestId: string) => ['requests', requestId] as const,
  },
  quotes: {
    byRequest: (requestId: string) => ['quotes', 'request', requestId] as const,
    mine: (status?: string) => ['quotes', 'mine', status ?? 'all'] as const,
  },
  providers: {
    me: ['providers', 'me'] as const,
    services: ['providers', 'services'] as const,
    opportunities: (serviceId?: string) =>
      ['providers', 'opportunities', serviceId ?? 'all'] as const,
  },
  messages: (requestId: string) => ['messages', requestId] as const,
  admin: {
    requests: ['admin', 'requests'] as const,
    reports: ['admin', 'reports'] as const,
    pendingProviders: ['admin', 'pending-providers'] as const,
  },
};
