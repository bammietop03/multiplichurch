import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  User,
} from "@/types";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// Get current user
export function useCurrentUser() {
  const { isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
      return data.data; // Extract from wrapper
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
      setLoading(false);
    }
  }, [query.data, setUser, setLoading]);

  useEffect(() => {
    if (query.isError) {
      logout();
    }
  }, [query.isError, logout]);

  return query;
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        credentials,
      );
      return data.data; // Extract from wrapper
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        userData,
      );
      return data.data; // Extract from wrapper
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      // Clear persisted storage
      localStorage.removeItem("auth-storage");
    },
    onError: () => {
      // Logout locally even if server fails
      logout();
      queryClient.clear();
      // Clear persisted storage
      localStorage.removeItem("auth-storage");
    },
  });
}

// Forgot password mutation
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      await apiClient.post("/auth/forgot-password", data);
    },
  });
}

// Reset password mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      await apiClient.post("/auth/reset-password", data);
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await apiClient.post("/auth/change-password", data);
    },
  });
}

// Verify email mutation
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      const { data: response } = await apiClient.post<
        ApiResponse<{ user: User }>
      >("/auth/verify-email", data);
      return response.data; // Extract from wrapper
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

// Resend verification email mutation
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post("/auth/resend-verification", { email });
    },
  });
}
