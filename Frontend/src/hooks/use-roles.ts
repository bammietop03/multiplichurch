import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  RoleWithPermissions,
  Permission,
  UserRoleAssignment,
  RolesStatistics,
  PaginatedResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  CreatePermissionRequest,
  AssignRoleToUserRequest,
} from "@/types";
import { toast } from "sonner";

// Query Keys
export const rolesKeys = {
  all: ["admin", "roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...rolesKeys.lists(), filters] as const,
  details: () => [...rolesKeys.all, "detail"] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
  statistics: () => [...rolesKeys.all, "statistics"] as const,
  permissions: () => ["admin", "permissions"] as const,
  permissionsList: (filters: Record<string, unknown>) =>
    [...rolesKeys.permissions(), "list", filters] as const,
  permissionDetail: (id: string) =>
    [...rolesKeys.permissions(), "detail", id] as const,
  userRoles: () => ["admin", "userRoles"] as const,
  userRolesList: (filters: Record<string, unknown>) =>
    [...rolesKeys.userRoles(), "list", filters] as const,
  roleUsers: (roleId: string) => [...rolesKeys.all, roleId, "users"] as const,
};

// ============================================
// ROLE QUERIES
// ============================================

export function useRoles(
  page = 1,
  limit = 10,
  search?: string,
  includeSystem = true
) {
  return useQuery({
    queryKey: rolesKeys.list({ page, limit, search, includeSystem }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (search) params.append("search", search);
      if (!includeSystem) params.append("includeSystem", "false");

      const { data } = await apiClient.get<
        PaginatedResponse<RoleWithPermissions>
      >(`/admin/roles?${params.toString()}`);
      return data;
    },
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<RoleWithPermissions>(
        `/admin/roles/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useRolesStatistics() {
  return useQuery({
    queryKey: rolesKeys.statistics(),
    queryFn: async () => {
      const { data } = await apiClient.get<RolesStatistics>(
        "/admin/roles/statistics"
      );
      return data;
    },
  });
}

export function useRoleUsers(roleId: string) {
  return useQuery({
    queryKey: rolesKeys.roleUsers(roleId),
    queryFn: async () => {
      const { data } = await apiClient.get<
        Array<{
          id: string;
          email: string;
          firstName?: string;
          lastName?: string;
          avatar?: string;
          status: string;
          createdAt: string;
        }>
      >(`/admin/roles/${roleId}/users`);
      return data;
    },
    enabled: !!roleId,
  });
}

// ============================================
// PERMISSION QUERIES
// ============================================

export function usePermissions(
  page = 1,
  limit = 50,
  action?: string,
  resource?: string
) {
  return useQuery({
    queryKey: rolesKeys.permissionsList({ page, limit, action, resource }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (action) params.append("action", action);
      if (resource) params.append("resource", resource);

      const { data } = await apiClient.get<PaginatedResponse<Permission>>(
        `/admin/roles/permissions/all?${params.toString()}`
      );
      return data;
    },
  });
}

export function usePermission(id: string) {
  return useQuery({
    queryKey: rolesKeys.permissionDetail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<
        Permission & { roles: Array<{ id: string; name: string }> }
      >(`/admin/roles/permissions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ============================================
// USER ROLES QUERIES
// ============================================

export function useUserRoles(
  page = 1,
  limit = 20,
  roleId?: string,
  search?: string
) {
  return useQuery({
    queryKey: rolesKeys.userRolesList({ page, limit, roleId, search }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (roleId) params.append("roleId", roleId);
      if (search) params.append("search", search);

      const { data } = await apiClient.get<
        PaginatedResponse<UserRoleAssignment>
      >(`/admin/roles/user-roles/all?${params.toString()}`);
      return data;
    },
  });
}

// ============================================
// ROLE MUTATIONS
// ============================================

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateRoleRequest) => {
      const { data } = await apiClient.post<RoleWithPermissions>(
        "/admin/roles",
        dto
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Role created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role");
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateRoleRequest }) => {
      const { data } = await apiClient.patch<RoleWithPermissions>(
        `/admin/roles/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(data.id) });
      toast.success("Role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Role deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete role");
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      dto,
    }: {
      roleId: string;
      dto: AssignPermissionsRequest;
    }) => {
      const { data } = await apiClient.post<RoleWithPermissions>(
        `/admin/roles/${roleId}/permissions`,
        dto
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(data.id) });
      toast.success("Permissions updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update permissions"
      );
    },
  });
}

export function useAddPermissionToRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
    }: {
      roleId: string;
      permissionId: string;
    }) => {
      const { data } = await apiClient.post<RoleWithPermissions>(
        `/admin/roles/${roleId}/permissions/${permissionId}`
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(data.id) });
      toast.success("Permission added to role");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add permission");
    },
  });
}

export function useRemovePermissionFromRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionId,
    }: {
      roleId: string;
      permissionId: string;
    }) => {
      const { data } = await apiClient.delete<RoleWithPermissions>(
        `/admin/roles/${roleId}/permissions/${permissionId}`
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(data.id) });
      toast.success("Permission removed from role");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to remove permission"
      );
    },
  });
}

// ============================================
// PERMISSION MUTATIONS
// ============================================

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePermissionRequest) => {
      const { data } = await apiClient.post<Permission>(
        "/admin/roles/permissions",
        dto
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Permission created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create permission"
      );
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/roles/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Permission deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete permission"
      );
    },
  });
}

// ============================================
// USER ROLE MUTATIONS
// ============================================

export function useAssignRoleToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: AssignRoleToUserRequest) => {
      const { data } = await apiClient.post<UserRoleAssignment>(
        "/admin/roles/user-roles",
        dto
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.userRoles() });
      queryClient.invalidateQueries({
        queryKey: rolesKeys.roleUsers(variables.roleId),
      });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Role assigned to user successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign role");
    },
  });
}

export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: AssignRoleToUserRequest) => {
      await apiClient.delete("/admin/roles/user-roles", { data: dto });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.userRoles() });
      queryClient.invalidateQueries({
        queryKey: rolesKeys.roleUsers(variables.roleId),
      });
      queryClient.invalidateQueries({ queryKey: rolesKeys.statistics() });
      toast.success("Role removed from user successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove role");
    },
  });
}
