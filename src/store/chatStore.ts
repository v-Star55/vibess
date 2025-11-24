'use client';

import { create } from "zustand";

interface ChatNotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useChatNotificationStore = create<ChatNotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

