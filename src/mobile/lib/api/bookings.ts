import { api } from './config';
import { Booking, BookingWithDetails, CreateBookingRequest } from '../types';

export const bookingsApi = {
  getAll: async (): Promise<BookingWithDetails[]> => {
    const response = await api.get<BookingWithDetails[]>('/bookings');
    return response.data;
  },

  getById: async (id: string): Promise<BookingWithDetails> => {
    const response = await api.get<BookingWithDetails>(`/bookings/${id}`);
    return response.data;
  },

  getByUserId: async (userId: string): Promise<BookingWithDetails[]> => {
    const response = await api.get<BookingWithDetails[]>(`/bookings/user/${userId}`);
    return response.data;
  },

  create: async (data: CreateBookingRequest): Promise<BookingWithDetails> => {
    const response = await api.post<BookingWithDetails>('/bookings', data);
    console.log(response.data);
    return response.data;
  },

  update: async (id: string, data: Partial<Booking>): Promise<BookingWithDetails> => {
    const response = await api.put<BookingWithDetails>('/bookings', { ...data, id });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },
};

