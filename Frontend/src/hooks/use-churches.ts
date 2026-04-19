import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  Church,
  ChurchMember,
  ChurchInvite,
  PaginatedResponse,
} from "@/types";

// Query keys
export const churchKeys = {
  all: ["churches"] as const,
  list: () => [...churchKeys.all, "list"] as const,
  detail: (id: string) => [...churchKeys.all, "detail", id] as const,
  members: (id: string) => [...churchKeys.all, "members", id] as const,
};

// Types
interface CreateChurchRequest {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateChurchRequest {
  name?: string;
  description?: string;
}

interface InviteMemberRequest {
  email: string;
  role: "ADMIN" | "MEMBER";
}

interface UpdateMemberRoleRequest {
  role: "ADMIN" | "MEMBER";
}

// Get all churches for current user
export function useChurches() {
  return useQuery({
    queryKey: churchKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get("/churches");
      return data.data as Church[];
    },
  });
}

// Get single church
export function useChurch(id: string) {
  return useQuery({
    queryKey: churchKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/churches/${id}`);
      return data.data as Church;
    },
    enabled: !!id,
  });
}

// Get church members
export function useChurchMembers(churchId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: churchKeys.members(churchId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/churches/${churchId}/members`, {
        params: { page, limit },
      });
      // Backend returns { success, data: ChurchMember[], meta: {...} }
      // Normalise into PaginatedResponse shape
      const members: ChurchMember[] = data.data ?? [];
      return {
        data: members,
        meta:
          data.meta?.total !== undefined
            ? data.meta
            : { total: members.length, page, limit, totalPages: 1 },
      } as PaginatedResponse<ChurchMember>;
    },
    enabled: !!churchId,
  });
}

// Create church mutation
export function useCreateChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (churchData: CreateChurchRequest) => {
      const { data } = await apiClient.post("/churches", churchData);
      return data.data as Church;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
    },
  });
}

// Update church mutation
export function useUpdateChurch(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateChurchRequest) => {
      const { data } = await apiClient.patch(`/churches/${id}`, updates);
      return data.data as Church;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(churchKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
    },
  });
}

// Update church logo mutation
export function useUpdateChurchLogo(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logo: string) => {
      const { data } = await apiClient.patch(`/churches/${id}/logo`, { logo });
      return data.data as Church;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(churchKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
    },
  });
}

// Delete church mutation
export function useDeleteChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/churches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
    },
  });
}

// Invite member mutation
export function useInviteMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invite: InviteMemberRequest) => {
      const { data } = await apiClient.post(
        `/churches/${churchId}/invites`,
        invite,
      );
      return data.data as ChurchInvite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.members(churchId) });
    },
  });
}

// Directly add a member (creates account if needed, sends credentials email)
export function useDirectAddMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      email: string;
      firstName?: string;
      lastName?: string;
      role: "ADMIN" | "MEMBER";
    }) => {
      const { data } = await apiClient.post(
        `/churches/${churchId}/members/direct`,
        dto,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.members(churchId) });
    },
  });
}

// Remove member mutation
export function useRemoveMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/churches/${churchId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.members(churchId) });
    },
  });
}

// Update member role mutation
export function useUpdateMemberRole(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: { memberId: string } & UpdateMemberRoleRequest) => {
      const { data } = await apiClient.patch(
        `/churches/${churchId}/members/${memberId}`,
        { role },
      );
      return data.data as ChurchMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.members(churchId) });
    },
  });
}

// Leave church mutation
export function useLeaveChurch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (churchId: string) => {
      await apiClient.post(`/churches/${churchId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
    },
  });
}

// Get invite by token (public)
export function useGetInvite(token: string | null) {
  return useQuery({
    queryKey: ["invites", token],
    queryFn: async () => {
      const { data } = await apiClient.get(`/invites/${token}`);
      return data.data as ChurchInvite;
    },
    enabled: !!token,
    retry: false,
  });
}

// Accept invite mutation
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(`/invites/${token}/accept`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchKeys.list() });
      // Refetch the current user so userChurches in the auth store is updated
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
