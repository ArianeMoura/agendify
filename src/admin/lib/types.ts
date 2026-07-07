export type Profile = "Administrator" | "Common";

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt?: string;
  user: User;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  profile: Profile;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  profile?: Profile;
}

export interface SpaceResource {
  resourceId: string;
  quantity: number;
  resource?: { id: string; name: string };
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  imageUrl?: string;
  resources: SpaceResource[];
  availableHours: string[];
  availability: boolean;
  isAllDayBooking: boolean;
  allDayStartTime?: string;
  allDayEndTime?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  spaceId: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  createdAt: string;
  user?: User;
  space?: Space;
}

export interface PeakHour {
  spaceId: string;
  hour: number;
  reservationsCount: number;
}
