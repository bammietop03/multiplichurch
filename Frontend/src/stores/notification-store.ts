import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth-store";
import { apiClient } from "@/lib/api-client";

export const NotificationType = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SYSTEM: "SYSTEM",
  PAYMENT: "PAYMENT",
  USER: "USER",
  ORGANIZATION: "ORGANIZATION",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  updateNotificationStatus: (notificationId: string, isRead: boolean) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<
  NotificationState & NotificationActions
>((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  socket: null,
  isConnected: false,
  isLoading: false,

  // Actions
  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<{
        data: Notification[];
        meta: { total: number; unreadCount: number };
      }>("/notifications", {
        params: { limit: 50 },
      });
      set({
        notifications: response.data.data,
        unreadCount: response.data.meta.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ count: number }>(
        "/notifications/unread-count",
      );
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      const { notifications } = get();
      set({
        notifications: notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      const { notifications } = get();
      const notification = notifications.find((n) => n.id === notificationId);
      set({
        notifications: notifications.filter((n) => n.id !== notificationId),
        unreadCount:
          notification && !notification.isRead
            ? Math.max(0, get().unreadCount - 1)
            : get().unreadCount,
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },

  deleteAllNotifications: async () => {
    try {
      await apiClient.delete("/notifications");
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  },

  connectWebSocket: () => {
    // Check if socket already exists and is connected
    const { socket: existingSocket } = get();
    if (existingSocket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    // Disconnect existing socket if it exists but is not connected
    if (existingSocket) {
      existingSocket.disconnect();
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      console.warn("Cannot connect to WebSocket: No access token");
      return;
    }

    const socket = io(
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
      {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
      },
    );

    socket.on("connect", () => {
      console.log("WebSocket connected");
      set({ isConnected: true });
      get().fetchUnreadCount();
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      set({ isConnected: false });
    });

    socket.on("notification", (notification: Notification) => {
      console.log("New notification received:", notification);
      get().addNotification(notification);
    });

    socket.on("unread-count", (data: { count: number }) => {
      console.log("Unread count updated:", data.count);
      get().setUnreadCount(data.count);
    });

    socket.on("notification:read", (data: { notificationId: string }) => {
      console.log("Notification marked as read:", data.notificationId);
      get().updateNotificationStatus(data.notificationId, true);
    });

    socket.on("notification:deleted", (data: { notificationId: string }) => {
      console.log("Notification deleted:", data.notificationId);
      get().removeNotification(data.notificationId);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      set({ isConnected: false });
    });

    set({ socket });
  },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications } = get();
    // Add to the beginning of the array
    set({
      notifications: [notification, ...notifications],
      unreadCount: !notification.isRead
        ? get().unreadCount + 1
        : get().unreadCount,
    });
  },

  removeNotification: (notificationId: string) => {
    const { notifications } = get();
    const notification = notifications.find((n) => n.id === notificationId);
    set({
      notifications: notifications.filter((n) => n.id !== notificationId),
      unreadCount:
        notification && !notification.isRead
          ? Math.max(0, get().unreadCount - 1)
          : get().unreadCount,
    });
  },

  updateNotificationStatus: (notificationId: string, isRead: boolean) => {
    const { notifications, unreadCount } = get();
    const notification = notifications.find((n) => n.id === notificationId);

    if (notification && notification.isRead !== isRead) {
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                isRead,
                readAt: isRead ? new Date().toISOString() : n.readAt,
              }
            : n,
        ),
        unreadCount: isRead ? Math.max(0, unreadCount - 1) : unreadCount + 1,
      });
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
