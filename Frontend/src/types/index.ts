// Enums
export type UserRole = "SUPER_ADMIN" | "USER";
export type ChurchRole = "ADMIN" | "MEMBER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

// User types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  userRole: UserRole;
  churches?: UserChurch[];
}

export interface UserChurch {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  membershipId: string;
  role: ChurchRole;
}

// Church types
export interface Church {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchMember {
  id: string;
  churchId: string;
  userId: string;
  role: ChurchRole;
  joinedAt: string;
  user?: User;
  church?: Church;
}

export interface ChurchInvite {
  id: string;
  churchId: string;
  email: string;
  role: ChurchRole;
  token: string;
  status: InviteStatus;
  invitedBy?: string;
  expiresAt: string;
  createdAt: string;
  church?: Church;
}

export interface AdminStats {
  totalUsers: number;
  totalChurches: number;
  totalMembers: number;
  verifiedUsers: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

// Standard API response wrapper from backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// Payment types removed

// Subscription types removed

// File types
export interface FileUpload {
  id: string;
  userId: string;
  organizationId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageType: "local" | "s3";
  storagePath: string;
  url?: string;
  isPublic: boolean;
  createdAt: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Error types
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Audit log types
export interface AuditLog {
  id: string;
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}