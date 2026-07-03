export enum Profile {
  Administrator = 'Administrator',
  Common = 'Common',
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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

export interface Space {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  resources: SpaceResource[];
  availableHours: string[];
  availability: boolean;
  imageUrl?: string;
  isAllDayBooking: boolean;
  allDayStartTime?: string;
  allDayEndTime?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SpaceResource {
  resourceId: string;
  quantity: number;
  resource?: Resource;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
}

export interface Booking {
  id: string;
  userId: string;
  spaceId: string;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingWithDetails extends Booking {
  User?: User;
  Space?: Space;
  space?: Space;
  user?: User;
}

export interface CreateBookingRequest {
  UserId: string;
  SpaceId: string;
  StartDateTime: string;
  EndDateTime: string;
}

export interface UpdateBookingRequest {
  spaceId?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isPast: boolean;
  isBooked: boolean;
}

export interface SpaceAvailability {
  spaceId: string;
  spaceName: string;
  date: string;
  timeSlots: TimeSlot[];
  isAllDayBooking: boolean;
  allDayStartTime?: string;
  allDayEndTime?: string;
}

