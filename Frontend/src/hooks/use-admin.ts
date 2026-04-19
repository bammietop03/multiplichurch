import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { User, AdminStats, Church, PaginatedResponse } from "@/types";

// Admin-specific query keys
export const adminKeys = {
  all: ["admin"] as const,
  users: (page?: number) => [...adminKeys.all, "users", page] as const,
  userDetail: (id: string) => [...adminKeys.all, "user", id] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  auditLogs: (page?: number) => [...adminKeys.all, "audit", page] as const,
  churches: (search?: string) =>
    [...adminKeys.all, "churches", search] as const,
  churchMembers: (id: string) =>
    [...adminKeys.all, "church-members", id] as const,
};

// Get admin stats
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const { data } = await apiClient.get("/users/admin/stats");
      return data.data as AdminStats;
    },
  });
}

// Get all users (admin)
export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.users(page),
    queryFn: async () => {
      const { data } = await apiClient.get("/users", {
        params: { page, limit },
      });
      return data.data as PaginatedResponse<User>;
    },
  });
}

// Get audit logs
export function useAuditLogs(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.auditLogs(page),
    queryFn: async () => {
      const { data } = await apiClient.get("/audit-logs", {
        params: { page, limit },
      });
      return data.data as PaginatedResponse<{
        id: string;
        userId?: string;
        user?: User;
        action: string;
        resource: string;
        resourceId?: string;
        details?: Record<string, unknown>;
        ipAddress?: string;
        createdAt: string;
      }>;
    },
  });
}

// Get all churches (admin)
export function useAdminChurches(search?: string) {
  return useQuery({
    queryKey: adminKeys.churches(search),
    queryFn: async () => {
      const { data } = await apiClient.get("/churches/admin/all", {
        params: search ? { search } : undefined,
      });
      return (data.data ?? data) as (Church & {
        _count: { members: number };
      })[];
    },
  });
}

// Admin create church
export function useAdminCreateChurch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      name: string;
      slug: string;
      description?: string;
    }) => {
      const { data } = await apiClient.post("/churches", dto);
      return data.data as Church;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.churches() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// Admin invite user to church
export function useAdminInviteMember(churchId: string) {
  return useMutation({
    mutationFn: async (dto: { email: string; role: "ADMIN" | "MEMBER" }) => {
      const { data } = await apiClient.post(
        `/churches/${churchId}/invites`,
        dto,
        { headers: { "x-church-id": churchId } },
      );
      return data.data;
    },
  });
}

// Admin delete church
export function useAdminDeleteChurch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (churchId: string) => {
      await apiClient.delete(`/churches/${churchId}`, {
        headers: { "x-church-id": churchId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.churches() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// Get church members (admin — no membership check)
export function useAdminChurchMembers(churchId: string) {
  return useQuery({
    queryKey: adminKeys.churchMembers(churchId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/churches/${churchId}/members/admin`,
      );
      return (data.data ?? data) as {
        id: string;
        role: "ADMIN" | "MEMBER";
        joinedAt: string;
        user: {
          id: string;
          email: string;
          firstName?: string;
          lastName?: string;
          avatar?: string;
          status: string;
        };
      }[];
    },
    enabled: !!churchId,
  });
}
