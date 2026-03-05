import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { User, PaginatedResponse } from "@/types";

// Admin-specific query keys
export const adminKeys = {
  all: ["admin"] as const,
  users: (page?: number) => [...adminKeys.all, "users", page] as const,
  userDetail: (id: string) => [...adminKeys.all, "user", id] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  auditLogs: (page?: number) => [...adminKeys.all, "audit", page] as const,
};

// Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  totalPayments: number;
  recentSignups: number;
  revenue: {
    total: number;
    currency: string;
  };
}

// Get admin stats (mock - adjust based on actual API)
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      // This would be a real admin endpoint
      // For now, return mock data
      const stats: AdminStats = {
        totalUsers: 1250,
        activeUsers: 890,
        totalOrganizations: 145,
        totalPayments: 3420,
        recentSignups: 47,
        revenue: {
          total: 125000,
          currency: "USD",
        },
      };
      return stats;
    },
  });
}

// Get all users (admin)
export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.users(page),
    queryFn: async () => {
      // Adjust endpoint based on actual admin API
      const { data } = await apiClient.get<PaginatedResponse<User>>("/users", {
        params: { page, limit },
      });
      return data;
    },
  });
}

// Get audit logs
export function useAuditLogs(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.auditLogs(page),
    queryFn: async () => {
      const { data } = await apiClient.get<
        PaginatedResponse<{
          id: string;
          userId?: string;
          user?: User;
          action: string;
          resource: string;
          resourceId?: string;
          details?: Record<string, unknown>;
          ipAddress?: string;
          createdAt: string;
        }>
      >("/audit-logs", {
        params: { page, limit },
      });
      return data;
    },
  });
}
