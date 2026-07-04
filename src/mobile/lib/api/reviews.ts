import { api } from './config';
import { CreateReviewRequest, Review } from '../types';

export const reviewsApi = {
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await api.post<Review>('/reviews', data);
    return response.data;
  },

  getBySpace: async (spaceId: string): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/reviews/space/${spaceId}`);
    return response.data;
  },
};
