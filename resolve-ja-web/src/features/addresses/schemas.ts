import { z } from 'zod';

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const optionalNullableString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional(),
);

export const addressFormSchema = z.object({
  label: optionalNullableString,
  postalCode: optionalString,
  state: z.string().trim().min(1, 'Informe o estado.'),
  city: z.string().trim().min(1, 'Informe a cidade.'),
  neighborhood: optionalNullableString,
  street: z.string().trim().min(1, 'Informe a rua.'),
  number: optionalNullableString,
  complement: optionalNullableString,
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
