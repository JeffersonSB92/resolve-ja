import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const messageFormSchema = z
  .object({
    body: optionalTrimmedString,
    attachmentPath: optionalTrimmedString,
  })
  .refine((value) => Boolean(value.body) || Boolean(value.attachmentPath), {
    message: 'Escreva uma mensagem antes de enviar.',
    path: ['body'],
  });

export type MessageFormValues = z.infer<typeof messageFormSchema>;
