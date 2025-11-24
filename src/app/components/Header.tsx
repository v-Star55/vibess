"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bell, MessageCircle, Search } from "lucide-react";
import { useUserStore } from "@/src/store/store";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { getUnreadChatCount } from "../lib/vibeApi";
import Image from "next/image";
import logo from "@/public/logo.png";

export default function Header() {
  const router = useRouter();
  const { user } = useUserStore();
  const { unreadCount, setUnreadCount } = useChatNotificationStore();

  const handleCreateClick = async () => {
    if (user?.id) {
      router.push(`/create/${user.id}`);
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let ignore = false;

    const fetchUnread = async () => {
      try {
        const res = await getUnreadChatCount();
        if (!ignore) {
          setUnreadCount(res?.unreadCount || 0);
        }
      } catch (error: any) {
        // Handle 401 (Unauthorized) gracefully - user might not be logged in or token expired
        if (error?.response?.status === 401) {
          if (!ignore) {
            setUnreadCount(0);
          }
          return;
        }
        // Only log unexpected errors
        console.error("Failed to fetch unread chats", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [user, setUnreadCount]);

  const hasUnread = unreadCount > 0;

  return (
    <div className="w-full sticky top-0 z-50 backdrop-blur-lg bg-black/30 border-b border-white/10">
      <div className="flex items-center justify-between gap-3 px-6 py-4 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src={logo}
            alt="Landing"
            width={50}
            height={50}
            className="rounded-full cursor-pointer"
            onClick={() => router.push("/app-home")}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Explore"
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition"
            onClick={() => router.push("/explore")}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Create"
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition"
            onClick={handleCreateClick}
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition relative"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            type="button"
            aria-label="Messages"
            className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/15 transition relative"
            onClick={() => router.push("/chat")}
          >
            <MessageCircle className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[11px] font-semibold flex items-center justify-center">
                {Math.min(unreadCount, 9)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}