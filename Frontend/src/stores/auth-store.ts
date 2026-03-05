import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, UserOrganization } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  activeOrganizationId: string | null;
  userOrganizations: UserOrganization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setActiveOrganization: (orgId: string | null) => void;
  setUserOrganizations: (orgs: UserOrganization[]) => void;
  login: (
    user: User,
    accessToken: string,
    organizations?: UserOrganization[]
  ) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      activeOrganizationId: null,
      userOrganizations: [],
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          userOrganizations: user?.organizations || [],
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setActiveOrganization: (activeOrganizationId) =>
        set({ activeOrganizationId }),

      setUserOrganizations: (userOrganizations) => set({ userOrganizations }),

      login: (user, accessToken, organizations = []) =>
        set({
          user,
          accessToken,
          userOrganizations:
            organizations.length > 0
              ? organizations
              : user?.organizations || [],
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          activeOrganizationId: null,
          userOrganizations: [],
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user?.role) return false;
        return user.role.name === roleName;
      },

      isAdmin: () => {
        const { user } = get();
        if (!user?.role) return false;
        return user.role.name === "Admin" || user.role.name === "Super Admin";
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        activeOrganizationId: state.activeOrganizationId,
        userOrganizations: state.userOrganizations,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, mark as initialized
        if (state) {
          state.setInitialized(true);
          state.setLoading(false);
        }
      },
    }
  )
);
