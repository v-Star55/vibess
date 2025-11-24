'use client';

import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  profileImage?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
