import { api } from './config';
import { User, UpdateUserRequest } from '../types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<void> => {
    await api.put(`/users/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
