import { z } from 'zod';

export const checkInSchema = z.object({
  selfiePath: z.string().trim().min(1, 'Informe o caminho da selfie.'),
  lat: z
    .union([z.number().finite(), z.nan()])
    .optional()
    .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
  lng: z
    .union([z.number().finite(), z.nan()])
    .optional()
    .transform((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : undefined)),
});

export const pinStartSchema = z.object({
  pin: z.string().trim().min(1, 'Informe o PIN de início.'),
});

export type CheckInFormValues = z.infer<typeof checkInSchema>;
export type PinStartFormValues = z.infer<typeof pinStartSchema>;
