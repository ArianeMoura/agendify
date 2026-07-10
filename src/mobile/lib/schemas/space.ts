import { z } from 'zod';

export const spaceSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .min(3, 'O nome deve ter no mínimo 3 caracteres'),
    description: z.string().optional(),
    capacity: z
      .string()
      .min(1, 'Capacidade é obrigatória')
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Capacidade deve ser um número maior que 0',
      }),
    availability: z.boolean().default(true),
    isAllDayBooking: z.boolean().default(false),
    allDayStartTime: z.string().optional(),
    allDayEndTime: z.string().optional(),
    availableHours: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.isAllDayBooking) {
        return !!data.allDayStartTime && !!data.allDayEndTime;
      }

      return true;
    },
    {
      message:
        'Para reservas de dia inteiro, informe o horário de início e término',
      path: ['allDayStartTime'],
    },
  );

export type SpaceFormData = z.infer<typeof spaceSchema>;
