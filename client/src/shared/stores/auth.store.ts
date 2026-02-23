import { create } from "zustand";

interface UserData {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  gender: string | null;
  isVerifiedBadge: boolean;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface PendingToast {
  message: string;
  type: "success" | "error";
  description?: string;
  position?: "top-center" | "top-right" | "bottom-right";
}

interface AuthStoreState {
  user: UserData | null;
  isAuthenticated: boolean;
  pendingToast: PendingToast | null;
  isLoading: boolean;
}

interface AuthStoreActions {
  setUser: (user: UserData) => void;
  clearUser: () => void;
  setPendingToast: (toast: PendingToast | null) => void;
  consumeToast: () => PendingToast | null;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  pendingToast: null,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),

  setPendingToast: (toast) => set({ pendingToast: toast }),
  consumeToast: () => {
    const toast = get().pendingToast;
    if (toast) set({ pendingToast: null });
    return toast;
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
