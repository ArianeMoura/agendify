import { z } from 'zod';

export const bookingSchema = z
  .object({
    UserId: z.string().min(1, 'Selecione um usuário'),
    SpaceId: z.string().min(1, 'Selecione um espaço'),
    StartDateTime: z.string().min(1, 'Data de início é obrigatória'),
    EndDateTime: z.string().min(1, 'Hora de término é obrigatória'),
  })
  .refine(
    (data) => {
      const start = new Date(data.StartDateTime).getTime();

      const end = new Date(data.EndDateTime).getTime();

      return end > start;
    },
    {
      message:
        'A data/hora de término deve ser posterior à data/hora de início',
      path: ['EndDateTime'],
    },
  );

export type BookingFormData = z.infer<typeof bookingSchema>;
