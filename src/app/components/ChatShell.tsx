"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMyChats, getUnreadChatCount, deleteChat } from "../lib/vibeApi";
import { useChatNotificationStore } from "@/src/store/chatStore";
import ChatListSidebar from "./chat/ChatListSidebar";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

type ChatPreview = {
  _id: string;
  otherParticipant?: {
    _id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  lastMessage?: {
    text: string;
    createdAt: string;
    sender: any;
  };
  hasUnread?: boolean;
  unreadMessages?: number;
  timeRemaining?: number | null;
  isLocked?: boolean;
  isPermanentlyUnlocked?: boolean;
};

interface ChatShellProps {
  children: React.ReactNode;
}

/**
 * ChatShell wraps all /chat/* pages with a 2-column layout:
 * - Left: chat list sidebar (340px)
 * - Right: conversation panel (flex-1)
 *
 * We render it only for chat-related pages via the layout file.
 */
export default function ChatShell({ children }: ChatShellProps) {
  const params = useParams();
  const router = useRouter();
  const activeChatId = (params?.chatId as string) || null;

  const { setUnreadCount } = useChatNotificationStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [search, setSearch] = useState("");

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadChatCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch {}
  }, [setUnreadCount]);

  const fetchChats = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getMyChats();
      const list: ChatPreview[] = res?.chats || [];
      setChats(list);
      const unread = list.filter((c) => c.hasUnread).length;
      setUnreadCount(unread);
    } catch {
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchChats();
    fetchUnreadCount();
  }, [fetchChats, fetchUnreadCount]);

  // Re-fetch when active chat changes (e.g., user opens or closes a chat)
  useEffect(() => {
    fetchChats();
  }, [activeChatId, fetchChats]);

  const handleDelete = useCallback(async (chatId: string) => {
    try {
      await deleteChat(chatId);
      toast.success("Chat removed from your inbox");
      if (activeChatId === chatId) {
        router.push("/chat");
      } else {
        fetchChats();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete chat");
    }
  }, [activeChatId, fetchChats, router]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(
      (c) =>
        c.otherParticipant?.name?.toLowerCase().includes(q) ||
        c.otherParticipant?.username?.toLowerCase().includes(q)
    );
  }, [chats, search]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Chat List Column ─────────────────── */}
      <div className="hidden md:flex w-[320px] lg:w-[340px] shrink-0 h-full flex-col">
        <ChatListSidebar
          chats={filteredChats}
          activeChatId={activeChatId}
          search={search}
          onSearchChange={setSearch}
          loading={loading}
          refreshing={refreshing}
          onRefresh={fetchChats}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Conversation Column ──────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Background radial glows */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(circle at 90% 5%, rgba(198,92,255,0.07), transparent 40%),
              radial-gradient(circle at 5% 90%, rgba(51,214,192,0.05), transparent 38%)
            `,
          }}
        />

        {/* Actual page content */}
        <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
          {!activeChatId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center flex flex-col items-center gap-4 max-w-xs">
                <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white/20 animate-pulse" />
                </div>
                <p className="text-white/60 text-lg font-bold tracking-tight">
                  Select a chat
                </p>
                <p className="text-white/30 text-sm leading-relaxed">
                  Pick a conversation from the list or discover new vibes.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
