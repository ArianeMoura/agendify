// Papéis do multi-tenancy: PlatformOwner (dona da plataforma) > OrgAdmin (gestor do
// tenant) > Member (usuário final do app). No mobile, "admin" = OrgAdmin ou PlatformOwner.
export enum Role {
  PlatformOwner = 'PlatformOwner',
  OrgAdmin = 'OrgAdmin',
  Member = 'Member',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt?: string;
  user: User;
}

// Aceite de convite (POST /api/invitations/accept, anônimo).
export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInvitationResponse {
  id: string;
  email: string;
}

export interface Review {
  id: string;
  userId: string;
  spaceId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  spaceId: string;
  rating: number;
  comment?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
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

// Espelha SpaceAvailabilityDto da API. NÃO tem allDayStartTime/allDayEndTime: o DTO não os
// envia. Declará-los aqui fazia o TypeScript aprovar `availability.allDayStartTime`, que
// vinha undefined em runtime e virava "Disponível de undefined até undefined" na tela.
// Esses horários moram no objeto Space (selectedSpace.allDayStartTime).
export interface SpaceAvailability {
  spaceId: string;
  spaceName: string;
  date: string;
  timeSlots: TimeSlot[];
  isAllDayBooking: boolean;
}
