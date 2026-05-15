import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const providerProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição.'),
  bio: optionalTrimmedString,
  baseState: z.string().trim().min(1, 'Informe o estado base.'),
  baseCity: z.string().trim().min(1, 'Informe a cidade base.'),
  baseNeighborhood: optionalTrimmedString,
  serviceRadiusKm: z
    .union([z.number().positive('O raio deve ser maior que zero.'), z.nan()])
    .optional()
    .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
});

export const providerServiceSchema = z.object({
  serviceId: z.string().uuid('Selecione um serviço válido.'),
  basePriceCents: z
    .union([z.number().int().min(0, 'Preço não pode ser negativo.'), z.nan()])
    .optional()
    .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
  priceNotes: optionalTrimmedString,
});

export const opportunityFiltersSchema = z.object({
  serviceId: optionalTrimmedString,
  city: optionalTrimmedString,
  neighborhood: optionalTrimmedString,
});

export type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;
export type ProviderServiceFormValues = z.infer<typeof providerServiceSchema>;
export type OpportunityFiltersFormValues = z.infer<typeof opportunityFiltersSchema>;
