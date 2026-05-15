import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const requestFormSchema = z
  .object({
    serviceId: z.string().uuid('Selecione um serviço válido.'),
    addressId: z.string().uuid('Selecione um endereço válido.'),
    title: z.string().trim().min(1, 'Informe o título da solicitação.'),
    description: optionalTrimmedString,
    desiredStartAt: optionalTrimmedString,
    desiredEndAt: optionalTrimmedString,
    budgetCents: z
      .union([z.number().int().min(0), z.nan()])
      .optional()
      .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
  })
  .refine(
    (value) => {
      if (!value.desiredStartAt || !value.desiredEndAt) {
        return true;
      }

      return new Date(value.desiredEndAt) >= new Date(value.desiredStartAt);
    },
    {
      path: ['desiredEndAt'],
      message: 'A data final não pode ser menor que a inicial.',
    },
  );

export type RequestFormValues = z.infer<typeof requestFormSchema>;
