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
  role?: Role | null;
  organizations?: UserOrganization[];
}

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  membershipId: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  role: Role;
  joinedAt: string;
  user?: User;
  organization?: Organization;
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

// Payment types
export type PaymentProvider = "PAYSTACK" | "STRIPE" | "FLUTTERWAVE";
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface Payment {
  id: string;
  userId: string;
  organizationId?: string;
  provider: PaymentProvider;
  providerRef?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitializePaymentRequest {
  amount: number;
  currency: string;
  email: string;
  provider: PaymentProvider;
  description?: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface InitializePaymentResponse {
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
}

// Subscription types
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "PAST_DUE"
  | "TRIALING"
  | "EXPIRED";
export type SubscriptionInterval =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: SubscriptionInterval;
  trialDays?: number;
  features?: Record<string, unknown>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  planId: string;
  plan?: SubscriptionPlan;
  provider: PaymentProvider;
  status: SubscriptionStatus;
  interval: SubscriptionInterval;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
}

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

// Permission types
export type PermissionAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "MANAGE";
export type PermissionResource =
  | "USER"
  | "ORGANIZATION"
  | "PAYMENT"
  | "AUDIT_LOG"
  | "FILE"
  | "API_KEY"
  | "ALL";

export interface Permission {
  id: string;
  action: PermissionAction;
  resource: PermissionResource;
  description?: string;
  rolesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Role types (extended)
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  usersCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: string;
  };
  role: {
    id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
}

export interface RolesStatistics {
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
  totalUserRoles: number;
  topRoles: Array<{
    id: string;
    name: string;
    usersCount: number;
  }>;
}

// Create/Update DTOs
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export interface CreatePermissionRequest {
  action: PermissionAction;
  resource: PermissionResource;
  description?: string;
}

export interface AssignRoleToUserRequest {
  userId: string;
  roleId: string;
}
