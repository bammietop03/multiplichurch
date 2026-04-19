import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, UserChurch } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  activeChurchId: string | null;
  userChurches: UserChurch[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setActiveChurch: (churchId: string | null) => void;
  setUserChurches: (churches: UserChurch[]) => void;
  login: (user: User, accessToken: string, churches?: UserChurch[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isChurchAdmin: (churchId?: string | null) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      activeChurchId: null,
      userChurches: [],
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          userChurches: user?.churches || [],
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setActiveChurch: (activeChurchId) => set({ activeChurchId }),

      setUserChurches: (userChurches) => set({ userChurches }),

      login: (user, accessToken, churches = []) => {
        const userChurches =
          churches.length > 0 ? churches : user?.churches || [];
        set({
          user,
          accessToken,
          userChurches,
          // Auto-set activeChurchId if not already stored
          activeChurchId:
            useAuthStore.getState().activeChurchId ??
            userChurches[0]?.id ??
            null,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      },

      logout: () =>
        set({
          user: null,
          accessToken: null,
          activeChurchId: null,
          userChurches: [],
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user) return false;
        return user.userRole === roleName;
      },

      isAdmin: () => {
        const { user } = get();
        if (!user) return false;
        return user.userRole === "SUPER_ADMIN";
      },

      isChurchAdmin: (churchId?: string | null) => {
        const { user, activeChurchId, userChurches } = get();
        if (!user) return false;
        if (user.userRole === "SUPER_ADMIN") return true;
        const id = churchId ?? activeChurchId;
        const church = userChurches.find((c) => c.id === id);
        return church?.role === "ADMIN";
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        activeChurchId: state.activeChurchId,
        userChurches: state.userChurches,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, mark as initialized
        if (state) {
          state.setInitialized(true);
          state.setLoading(false);
        }
      },
    },
  ),
);
