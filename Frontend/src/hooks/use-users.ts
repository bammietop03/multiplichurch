import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { User, Organization, AuditLog, PaginatedResponse } from "@/types";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  organizations: () => [...userKeys.all, "organizations"] as const,
  activity: (page?: number) => [...userKeys.all, "activity", page] as const,
};

// Get user profile
export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const { data } = await apiClient.get<User>("/users/me");
      return data;
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (
      updates: Partial<Pick<User, "firstName" | "lastName" | "avatar">>
    ) => {
      const { data } = await apiClient.patch<User>("/users/me", updates);
      return data;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(userKeys.profile(), data);
    },
  });
}

// Get user organizations
export function useUserOrganizations() {
  const { setUserOrganizations } = useAuthStore();

  return useQuery({
    queryKey: userKeys.organizations(),
    queryFn: async () => {
      const { data } = await apiClient.get<Organization[]>(
        "/users/me/organizations"
      );
      setUserOrganizations(data);
      return data;
    },
  });
}

// Get user activity
export function useUserActivity(page = 1, limit = 20) {
  return useQuery({
    queryKey: userKeys.activity(page),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
        "/users/me/activity",
        {
          params: { page, limit },
        }
      );
      return data;
    },
  });
}

// Deactivate account mutation
export function useDeactivateAccount() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.patch("/users/me/deactivate");
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Delete account mutation
export function useDeleteAccount() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/users/me");
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

// Export user data (GDPR)
export function useExportUserData() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get("/users/me/export", {
        responseType: "blob",
      });
      return data;
    },
  });
}
