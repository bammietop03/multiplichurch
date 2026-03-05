import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification-store";
import { useAuthStore } from "@/stores/auth-store";

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    connectWebSocket,
    disconnectWebSocket,
  } = useNotificationStore();

  const { isAuthenticated } = useAuthStore();

  // Connect/disconnect WebSocket based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
      fetchNotifications();
    }

    return () => {
      if (isAuthenticated) {
        disconnectWebSocket();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
