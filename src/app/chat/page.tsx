"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyChats, getUnreadChatCount } from "../lib/vibeApi";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { Loader2, MessageCircle, RefreshCw, Search, AlertCircle } from "lucide-react";

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
};

export default function ChatInboxPage() {
  const router = useRouter();
  const { setUnreadCount, unreadCount } = useChatNotificationStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [search, setSearch] = useState("");

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadChatCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to refresh unread count", error);
    }
  }, [setUnreadCount]);

  const fetchChats = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getMyChats();
      const list: ChatPreview[] = res?.chats || [];
      setChats(list);
      const unread = list.filter((chat) => chat.hasUnread).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load chats", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchChats();
    fetchUnreadCount();
  }, [fetchChats, fetchUnreadCount]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const query = search.toLowerCase();
    return chats.filter((chat) =>
      chat.otherParticipant?.name?.toLowerCase().includes(query) ||
      chat.otherParticipant?.username?.toLowerCase().includes(query)
    );
  }, [chats, search]);

  return (
    <div className="h-full w-full bg-linear-to-br from-[#0a0118] via-[#1d0033] to-[#2a0044] text-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Inbox</p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">Your Chats</h1>
            <p className="text-white/60 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} chat${unreadCount > 1 ? "s" : ""} with new messages`
                : "All caught up! Start a new vibe conversation."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/vibe/discover")}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition"
            >
              Find Matches
            </button>
            <button
              onClick={fetchChats}
              className="p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition"
              aria-label="Refresh chats"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-10 h-10 text-white/60" />
            <p className="text-white/80 text-lg">No chats yet</p>
            <p className="text-white/60 text-sm">
              Matching with someone unlocks a 24-hour chat window. Keep sharing your vibe!
            </p>
            <button
              onClick={() => router.push("/vibe/discover")}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold"
            >
              Discover Vibes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => (
              <ChatListItem key={chat._id} chat={chat} onOpen={() => router.push(`/chat/${chat._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp?: string, fallback: string = "") {
  if (!timestamp) return fallback;
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function ChatListItem({
  chat,
  onOpen,
}: {
  chat: ChatPreview;
  onOpen: () => void;
}) {
  const participant = chat.otherParticipant;
  const lastMessageText = chat.lastMessage?.text || "No messages yet";
  const lastMessageTime = chat.lastMessage?.createdAt
    ? formatRelativeTime(chat.lastMessage.createdAt)
    : "";
  const unreadCount = chat.unreadMessages || 0;

  return (
    <button
      onClick={onOpen}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition ${
        chat.hasUnread ? "ring-2 ring-pink-400/70" : ""
      }`}
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
          {participant?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={participant.profileImage} alt={participant.name} className="w-full h-full object-cover" />
          ) : (
            <span>{participant?.name?.charAt(0) || "U"}</span>
          )}
        </div>
        {chat.hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 border-2 border-[#10001e]" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{participant?.name || "Unknown user"}</p>
          {chat.timeRemaining !== null && (
            <span className="text-[11px] uppercase tracking-wide text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              {chat.timeRemaining && chat.timeRemaining > 0
                ? `${Math.ceil(chat.timeRemaining / (60 * 60 * 1000))}h left`
                : "Locked soon"}
            </span>
          )}
        </div>
        <p className="text-sm text-white/70 truncate">
          {lastMessageText}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-white/50">{lastMessageTime}</span>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-pink-500 text-xs font-semibold">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

