import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  Organization,
  OrganizationMember,
  PaginatedResponse,
} from "@/types";

// Query keys
export const organizationKeys = {
  all: ["organizations"] as const,
  list: () => [...organizationKeys.all, "list"] as const,
  detail: (id: string) => [...organizationKeys.all, "detail", id] as const,
  members: (id: string) => [...organizationKeys.all, "members", id] as const,
};

// Types
interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo?: string;
}

interface InviteMemberRequest {
  email: string;
  role: "Owner" | "Admin" | "Member";
}

interface UpdateMemberRoleRequest {
  role: "Owner" | "Admin" | "Member";
}

// Get all organizations for current user
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<Organization[]>("/organizations");
      return data;
    },
  });
}

// Get single organization
export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Organization>(
        `/organizations/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}

// Get organization members
export function useOrganizationMembers(orgId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<OrganizationMember>
      >(`/organizations/${orgId}/members`, {
        params: { page, limit },
      });
      return data;
    },
    enabled: !!orgId,
  });
}

// Create organization mutation
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgData: CreateOrganizationRequest) => {
      const { data } = await apiClient.post<Organization>(
        "/organizations",
        orgData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

// Update organization mutation
export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateOrganizationRequest) => {
      const { data } = await apiClient.patch<Organization>(
        `/organizations/${id}`,
        updates
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(organizationKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

// Delete organization mutation
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}

// Invite member mutation
export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invite: InviteMemberRequest) => {
      const { data } = await apiClient.post<OrganizationMember>(
        `/organizations/${orgId}/members`,
        invite
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

// Remove member mutation
export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/organizations/${orgId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

// Update member role mutation
export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: { memberId: string } & UpdateMemberRoleRequest) => {
      const { data } = await apiClient.patch<OrganizationMember>(
        `/organizations/${orgId}/members/${memberId}`,
        { role }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

// Leave organization mutation
export function useLeaveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      await apiClient.post(`/organizations/${orgId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.list() });
    },
  });
}
