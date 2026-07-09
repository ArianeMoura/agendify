export type Role = "PlatformOwner" | "OrgAdmin" | "Member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
  role: Role;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

// Self-signup de organização (POST /api/organizations, anônimo).
export interface CreateOrganizationRequest {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CreateOrganizationResponse {
  organizationId: string;
  organizationName: string;
  slug: string;
  adminUserId: string;
  adminEmail: string;
}

// Convite de membro (POST /api/invitations, OrgAdmin autenticado).
export interface CreateInvitationRequest {
  email: string;
  role: Role;
}

export interface CreateInvitationResponse {
  token: string;
  expiresAt: string;
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
