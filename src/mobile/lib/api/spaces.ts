import { api } from './config';
import { Space, SpaceAvailability } from '../types';

interface CreateSpaceData {
  name: string;
  description?: string;
  capacity: number;
  resources: any[];
  availableHours: string[];
  availability: boolean;
  isAllDayBooking: boolean;
  allDayStartTime?: string;
  allDayEndTime?: string;
  imageUri?: string;
}

interface UpdateSpaceData extends CreateSpaceData {
  id: string;
}

export const spacesApi = {
  getAll: async (): Promise<Space[]> => {
    const response = await api.get<Space[]>('/spaces');
    return response.data;
  },

  getById: async (id: string): Promise<Space> => {
    const response = await api.get<Space>(`/spaces/${id}`);
    return response.data;
  },

  getAvailability: async (
    spaceId: string,
    date: string,
    timezone: string
  ): Promise<SpaceAvailability> => {
    const response = await api.get<SpaceAvailability>(
      `/spaces/${spaceId}/availability`,
      {
        params: { date, timezone },
      }
    );
    return response.data;
  },

  create: async (data: CreateSpaceData): Promise<Space> => {
    const formData = new FormData();
    
    const spaceData = {
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      resources: data.resources,
      availableHours: data.availableHours,
      availability: data.availability,
      isAllDayBooking: data.isAllDayBooking,
      allDayStartTime: data.allDayStartTime,
      allDayEndTime: data.allDayEndTime,
    };

    formData.append('spaceData', JSON.stringify(spaceData));
    
    if (data.imageUri) {
      const filename = data.imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: data.imageUri,
        name: filename,
        type,
      } as any);
    }
    
    const response = await api.post<Space>('/spaces', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  update: async (id: string, data: Partial<UpdateSpaceData>): Promise<Space> => {
    const formData = new FormData();
    
    const spaceData = {
      id,
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      resources: data.resources,
      availableHours: data.availableHours,
      availability: data.availability,
      isAllDayBooking: data.isAllDayBooking,
      allDayStartTime: data.allDayStartTime,
      allDayEndTime: data.allDayEndTime,
    };

    formData.append('spaceData', JSON.stringify(spaceData));
    
    if (data.imageUri) {
      const filename = data.imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: data.imageUri,
        name: filename,
        type,
      } as any);
    }
    
    const response = await api.put<Space>('/spaces', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/spaces/${id}`);
  },
};

