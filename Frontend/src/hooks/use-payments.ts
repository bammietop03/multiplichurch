import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  Payment,
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaginatedResponse,
} from "@/types";

// Query keys
export const paymentKeys = {
  all: ["payments"] as const,
  list: (page?: number) => [...paymentKeys.all, "list", page] as const,
  detail: (id: string) => [...paymentKeys.all, "detail", id] as const,
};

// Types
interface RefundPaymentRequest {
  reference: string;
  amount?: number;
  reason?: string;
}

// Get payment history
export function usePaymentHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: paymentKeys.list(page),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Payment>>(
        "/payments/history",
        {
          params: { page, limit },
        }
      );
      return data;
    },
  });
}

// Get single payment
export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Payment>(`/payments/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Initialize payment mutation
export function useInitializePayment() {
  return useMutation({
    mutationFn: async (paymentData: InitializePaymentRequest) => {
      const { data } = await apiClient.post<InitializePaymentResponse>(
        "/payments/initialize",
        paymentData
      );
      return data;
    },
  });
}

// Verify payment mutation
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reference,
      provider,
    }: {
      reference: string;
      provider: "PAYSTACK" | "STRIPE" | "FLUTTERWAVE";
    }) => {
      const { data } = await apiClient.post<Payment>(
        `/payments/${reference}/verify`,
        {
          provider,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.list() });
    },
  });
}

// Refund payment mutation
export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundData: RefundPaymentRequest) => {
      const { data } = await apiClient.post<Payment>(
        "/payments/refund",
        refundData
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.list() });
    },
  });
}
