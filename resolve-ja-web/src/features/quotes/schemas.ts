import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const sendQuoteSchema = z.object({
  amountCents: z.number().int().positive('Informe um valor maior que zero.'),
  estimatedDurationMinutes: z
    .union([z.number().int().positive('A duração deve ser maior que zero.'), z.nan()])
    .optional()
    .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
  message: optionalTrimmedString,
  validUntil: optionalTrimmedString,
});

export type SendQuoteFormValues = z.infer<typeof sendQuoteSchema>;
