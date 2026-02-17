import { create } from "zustand";

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string;
}

interface PendingToast {
  message: string;
  type: "success" | "error";
  description?: string;
  position?: "top-center" | "top-right" | "bottom-right";
}

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  pendingToast: PendingToast | null;
}

interface AuthStoreActions {
  setUser: (user: User) => void;
  clearUser: () => void;
  setPendingToast: (toast: PendingToast | null) => void;
  consumeToast: () => PendingToast | null;
}

type AuthStore = AuthStoreState & AuthStoreActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  pendingToast: null,

  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),

  setPendingToast: (toast) => set({ pendingToast: toast }),
  consumeToast: () => {
    const toast = get().pendingToast;
    if (toast) set({ pendingToast: null });
    return toast;
  },
}));
