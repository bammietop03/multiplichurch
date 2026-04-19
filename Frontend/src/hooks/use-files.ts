import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { FileUpload, PaginatedResponse } from "@/types";

// Query keys
export const fileKeys = {
  all: ["files"] as const,
  list: (page?: number) => [...fileKeys.all, "list", page] as const,
  detail: (id: string) => [...fileKeys.all, "detail", id] as const,
};

// Get files list
export function useFiles(page = 1, limit = 20) {
  return useQuery({
    queryKey: fileKeys.list(page),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FileUpload>>(
        "/files",
        {
          params: { page, limit },
        },
      );
      return data;
    },
  });
}

// Get single file
export function useFile(id: string) {
  return useQuery({
    queryKey: fileKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<FileUpload>(`/files/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Upload file mutation
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Unwrap the response interceptor envelope
      return (data.data ?? data) as FileUpload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.list() });
    },
  });
}

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.list() });
    },
  });
}

// Get file download URL
export function useFileDownloadUrl(id: string) {
  return useQuery({
    queryKey: [...fileKeys.detail(id), "download"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ url: string }>(
        `/files/${id}/download`,
      );
      return data.url;
    },
    enabled: !!id,
  });
}
